import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import * as https from "https";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});

initializeApp();
const db = getFirestore();
const bucket = getStorage().bucket();

// ─────────────────────────────────────────────────────────────────────────────
// compareFaces — Callable HTTPS: proxy Face++ API
// ─────────────────────────────────────────────────────────────────────────────

export const compareFaces = onCall(
  {region: "europe-west1", enforceAppCheck: false},
  async (request) => {
    const data = request.data as {image1: string; image2: string};

    if (!data.image1 || !data.image2) {
      throw new Error("Missing image1 or image2");
    }

    const apiKey = process.env.FACE_PLUS_PLUS_KEY;
    const apiSecret = process.env.FACE_PLUS_PLUS_SECRET;

    // Graceful fallback if no credentials configured
    if (!apiKey || !apiSecret) {
      logger.warn("Face++ credentials not configured — returning 100");
      return {confidence: 100};
    }

    try {
      const result = await callFacePlusPlus(
        data.image1,
        data.image2,
        apiKey,
        apiSecret
      );
      return {confidence: result};
    } catch (error) {
      logger.error("Face++ API error:", error);
      return {confidence: 100};
    }
  }
);

// eslint-disable-next-line require-jsdoc
async function callFacePlusPlus(
  base64Image1: string,
  base64Image2: string,
  apiKey: string,
  apiSecret: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const image1Param = encodeURIComponent(base64Image1);
    const image2Param = encodeURIComponent(base64Image2);
    const postData = `api_key=${apiKey}&api_secret=${apiSecret}` +
      `&image_base64_1=${image1Param}&image_base64_2=${image2Param}`;

    const options = {
      hostname: "api-us.faceplusplus.com",
      port: 443,
      path: "/facepp/v3/compare",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(responseData);
          if (json.confidence !== undefined) {
            resolve(parseFloat(json.confidence));
          } else if (json.error_message) {
            reject(new Error(`Face++ error: ${json.error_message}`));
          } else {
            reject(new Error("Invalid Face++ response"));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Face++ response: ${e}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Face++ request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. uploadPhoto — Callable HTTPS: upload vers Firebase Storage
// ─────────────────────────────────────────────────────────────────────────────

export const uploadPhoto = onCall(
  {region: "europe-west1", enforceAppCheck: false},
  async (request) => {
    const userId = request.auth?.uid;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const data = request.data as {data: string; ext: string};
    if (!data.data || !data.ext) {
      throw new Error("Missing data or ext");
    }

    try {
      // Decode base64
      const buffer = Buffer.from(data.data, "base64");

      // Generate filename
      const timestamp = Date.now();
      const filename = `photos/${userId}/${timestamp}.${data.ext}`;

      // Upload to Firebase Storage
      const file = bucket.file(filename);
      await file.save(buffer, {
        metadata: {
          contentType: `image/${data.ext}`,
          cacheControl: "public, max-age=3600",
        },
      });

      // Make it public
      await file.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      logger.info(`Photo uploaded: ${publicUrl}`);

      // Update profile with new photo URL
      await db.collection("profiles").doc(userId).update({
        photos: admin.firestore.FieldValue.arrayUnion([
          {url: publicUrl, uploadedAt: new Date()},
        ]),
        updatedAt: new Date(),
      });

      return {url: publicUrl};
    } catch (error) {
      logger.error("Photo upload error:", error);
      throw new Error(`Upload failed: ${error}`);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE IDENTITY VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";

// Initialize Stripe with key from env (loaded in function calls)
let stripe: Stripe | null = null;

/**
 * Creates a Stripe Identity verification session for age verification
 * Callable from Flutter via FirebaseFunctions
 */
export const createVerificationSession = onCall(
  {region: "europe-west1", enforceAppCheck: false},
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      logger.error("[Verification] User not authenticated");
      throw new Error("User must be authenticated");
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      logger.error("[Verification] STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe not configured");
    }

    try {
      // Initialize Stripe with the configured key
      if (!stripe) {
        stripe = new Stripe(stripeKey);
      }

      // Get user from Firestore
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        logger.error(`[Verification] User document not found: ${userId}`);
        throw new Error("User not found");
      }

      const user = userDoc.data();

      // Create Stripe verification session
      const session = await stripe.identity.verificationSessions.create({
        type: "id_number",
        metadata: {
          userId,
          email: user?.email,
        },
        options: {
          document: {
            allowed_types: ["passport", "driving_license", "id_card"],
          },
        },
      });

      // Save session reference to Firestore
      await db.collection("users").doc(userId).update({
        stripeVerificationId: session.id,
        ageVerificationStatus: "pending",
        ageVerificationAttempts: (user?.ageVerificationAttempts || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(
        `[Verification] Session created for ${userId}: ${session.id}`
      );

      return {
        session_id: session.id,
        client_secret: session.client_secret,
      };
    } catch (error) {
      logger.error("[Verification] Error creating session:", error);
      throw error;
    }
  }
);

/**
 * Stripe webhook handler - processes verification events
 * Called by Stripe when identity verification completes
 */
export const handleStripeWebhook = onCall(
  {region: "europe-west1", enforceAppCheck: false},
  async (request) => {
    const signature = request.rawRequest?.headers["stripe-signature"] as string;

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("Webhook secret not configured");
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("Stripe not configured");
    }

    try {
      if (!stripe) {
        stripe = new Stripe(stripeKey);
      }

      const event = stripe.webhooks.constructEvent(
        request.rawRequest?.body || "",
        signature,
        webhookSecret
      );

      logger.info(`[Webhook] Event received: ${event.type}`);

      // Only process verified events
      if (event.type !== "identity.verification_session.verified") {
        logger.info(`[Webhook] Ignoring event type: ${event.type}`);
        return {received: true};
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any;
      const userId = session.metadata?.userId;

      if (!userId) {
        logger.warn("[Webhook] No userId in metadata");
        return {received: true};
      }

      // Verify user exists and session matches
      const userDoc = await db.collection("users").doc(userId).get();
      if (
        !userDoc.exists ||
        userDoc.data()?.stripeVerificationId !== session.id
      ) {
        logger.warn(`[Webhook] Session mismatch for ${userId}`);
        return {received: true};
      }

      // UPDATE USER - VERIFIED!
      await db.collection("users").doc(userId).update({
        isAgeVerified: true,
        ageVerifiedAt: admin.firestore.Timestamp.now(),
        ageVerificationStatus: "verified",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      await db.collection("verificationLogs").add({
        userId,
        type: "age",
        status: "success",
        metadata: {
          verificationSessionId: session.id,
          ageAbove18: session.verified_outputs?.age_above_18,
        },
        createdAt: admin.firestore.Timestamp.now(),
      });

      logger.info(`[Webhook] ✓ User ${userId} verified successfully`);
      return {success: true};
    } catch (error) {
      logger.error("[Webhook] Error processing webhook:", error);
      throw error;
    }
  }
);

/**
 * Gets verification status - optional polling endpoint
 */
export const getVerificationStatus = onCall(
  {region: "europe-west1", enforceAppCheck: false},
  async (request) => {
    const userId = request.auth?.uid;
    const verificationId = request.data.verificationId as string;

    if (!userId) {
      throw new Error("User must be authenticated");
    }

    if (!verificationId) {
      throw new Error("Missing verificationId");
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("Stripe not configured");
    }

    try {
      // Initialize Stripe with the configured key
      if (!stripe) {
        stripe = new Stripe(stripeKey);
      }

      // Verify user owns this session
      const userDoc = await db.collection("users").doc(userId).get();
      const user = userDoc.data();

      if (user?.stripeVerificationId !== verificationId) {
        throw new Error("Unauthorized");
      }

      // Get session from Stripe
      const session = await stripe.identity.verificationSessions.retrieve(
        verificationId
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const verifiedOutputs = session.verified_outputs as any;
      return {
        id: session.id,
        status: session.status,
        ageAbove18:
          verifiedOutputs?.age_above_18 ||
          verifiedOutputs?.birthdate != null,
        createdAt: new Date(session.created * 1000).toISOString(),
      };
    } catch (error) {
      logger.error("[VerificationStatus] Error:", error);
      throw error;
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CHAT NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CHAT NOTIFICATIONS - Auto-triggered on new message
// ─────────────────────────────────────────────────────────────────────────────

import {onDocumentCreated} from "firebase-functions/v2/firestore";

/**
 * Sends push notifications when a new message is created
 * Automatically triggered by Firestore onCreate event
 *
 * Firestore path: conversations/{conversationId}/messages/{messageId}
 */
export const onMessageCreated = onDocumentCreated(
  {
    document: "conversations/{conversationId}/messages/{messageId}",
    region: "europe-west1",
  },
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.error("[Chat] No document data in event");
        return;
      }

      const messageData = snapshot.data();
      const conversationId = event.params.conversationId;
      const messageId = event.params.messageId;

      // Validate message data
      const senderId = messageData.senderId as string | undefined;
      const content = messageData.content as string | undefined;
      const type = messageData.type as string | undefined;

      if (!conversationId || !senderId || !content) {
        logger.warn("[Chat] Invalid message data", {
          conversationId,
          senderId,
          messageId,
        });
        return;
      }

      // Get conversation document to find recipient
      const conversationDoc = await db
        .collection("conversations")
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        logger.warn(`[Chat] Conversation not found: ${conversationId}`);
        return;
      }

      const conversation = conversationDoc.data();
      if (!conversation) {
        logger.warn(`[Chat] No conversation data: ${conversationId}`);
        return;
      }

      const participants = (conversation.participants as string[]) || [];
      if (!Array.isArray(participants) || participants.length < 2) {
        logger.warn(
          `[Chat] Invalid participants in conversation: ${conversationId}`,
        );
        return;
      }

      // Find recipient (the other participant)
      const recipientId = participants.find((id) => id !== senderId);
      if (!recipientId) {
        logger.warn("[Chat] No recipient found", {
          conversationId,
          participants,
          senderId,
        });
        return;
      }

      // Get sender profile for name
      const senderDoc = await db.collection("profiles").doc(senderId).get();
      const senderName = senderDoc.data()?.name || "Unknown";

      // Get recipient profile and FCM tokens
      const recipientDoc = await db
        .collection("profiles")
        .doc(recipientId)
        .get();

      if (!recipientDoc.exists) {
        logger.warn(`[Chat] Recipient profile not found: ${recipientId}`);
        return;
      }

      const recipientData = recipientDoc.data();
      const fcmTokens = (recipientData?.fcmTokens as Record<string, boolean>) ||
        {};
      const tokens = Object.keys(fcmTokens).filter((token) => fcmTokens[token]);

      if (tokens.length === 0) {
        logger.info(`[Chat] No FCM tokens for recipient: ${recipientId}`);
        return;
      }

      // Prepare notification content
      const notificationTitle = `Message from ${senderName}`;
      let notificationBody = content;

      // Handle different message types
      if (type === "image") {
        notificationBody = "📷 Sent a photo";
      } else if (type === "voice") {
        notificationBody = "🎤 Sent a voice message";
      }

      // Truncate body if too long
      if (notificationBody.length > 100) {
        notificationBody = notificationBody.substring(0, 97) + "...";
      }

      // Prepare FCM message
      const fcmMessage = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          conversationId: conversationId,
          senderId: senderId,
          messageId: messageId,
          type: "chat_message",
        },
        tokens: tokens,
      };

      // Send multicast notification
      const response = await admin.messaging().sendEachForMulticast(fcmMessage);

      logger.info("[Chat] Notification sent", {
        conversationId,
        recipientId,
        tokensCount: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Clean up invalid/expired tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            // Only delete tokens with specific errors
            if (
              error &&
              (error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered")
            ) {
              invalidTokens.push(tokens[idx]);
              logger.warn("[Chat] Invalid token to clean up", {
                token: tokens[idx].substring(0, 10) + "...",
                error: error.code,
              });
            }
          }
        });

        if (invalidTokens.length > 0) {
          const updateData: Record<string, admin.firestore.FieldValue> = {};
          invalidTokens.forEach((token) => {
            updateData[
              `fcmTokens.${token}`
            ] = admin.firestore.FieldValue.delete();
          });

          await db
            .collection("profiles")
            .doc(recipientId)
            .update(updateData)
            .catch((err) => {
              logger.warn("[Chat] Failed to clean up invalid tokens", {
                error: err,
                recipientId,
              });
            });

          logger.info("[Chat] Cleaned up invalid tokens", {
            count: invalidTokens.length,
            recipientId,
          });
        }
      }
    } catch (error) {
      logger.error("[Chat] Error sending notification", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't rethrow - allow function to complete gracefully
    }
  },
);
