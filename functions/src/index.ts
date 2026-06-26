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

/**
 * Sends a push notification when a new message is sent
 * Triggered by Firestore onCreate event on messages
 */
export const onNewMessage = onCall(
  {region: "europe-west1", enforceAppCheck: false},
  async (request) => {
    const data = request.data as {
      conversationId: string;
      senderId: string;
      senderName: string;
      senderPhoto?: string;
      messageContent: string;
      messageType: string;
    };

    const {
      conversationId,
      senderId,
      senderName,
      messageContent,
      messageType,
    } = data;

    if (!conversationId || !senderId || !messageContent) {
      throw new Error("Missing required fields");
    }

    try {
      // Get conversation to find recipient
      const conversationDoc = await db
        .collection("conversations")
        .doc(conversationId)
        .get();
      if (!conversationDoc.exists) {
        logger.warn(`[Chat] Conversation not found: ${conversationId}`);
        return {success: false};
      }

      const conversation = conversationDoc.data();
      const participants = conversation?.participants as string[] || [];

      // Find recipient (the other participant)
      const recipientId = participants.find((id) => id !== senderId);
      if (!recipientId) {
        logger.warn("[Chat] No recipient found");
        return {success: false};
      }

      // Get recipient's FCM tokens
      const recipientDoc = await db
        .collection("profiles")
        .doc(recipientId)
        .get();
      if (!recipientDoc.exists) {
        logger.warn(`[Chat] Recipient not found: ${recipientId}`);
        return {success: false};
      }

      const recipient = recipientDoc.data();
      const fcmTokens = recipient?.fcmTokens as Record<string, boolean> || {};
      const tokens = Object.keys(fcmTokens);

      if (tokens.length === 0) {
        logger.info(`[Chat] No FCM tokens for recipient: ${recipientId}`);
        return {success: false};
      }

      // Prepare notification content
      const title = `New message from ${senderName}`;
      let body = messageContent;

      if (messageType === "image") {
        body = "📷 Sent a photo";
      } else if (messageType === "voice") {
        body = "🎤 Sent a voice message";
      }

      // Trim body if too long
      if (body.length > 100) {
        body = body.substring(0, 97) + "...";
      }

      // Send notification
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          conversationId,
          senderId,
          type: "chat_message",
        },
        tokens,
      };

      const response = await admin
        .messaging()
        .sendEachForMulticast(message);

      logger.info(
        `[Chat] Notification sent to ${tokens.length} tokens, ` +
          `${response.successCount} successful`,
      );

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx: number) => {
          if (!resp.success) {
            invalidTokens.push(tokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          const updateData: Record<string, admin.firestore.FieldValue> = {};
          invalidTokens.forEach((token) => {
            updateData[
              `fcmTokens.${token}`
            ] = admin.firestore.FieldValue.delete();
          });

          await db.collection("profiles").doc(recipientId).update(updateData);
          logger.info(
            `[Chat] Cleaned up ${invalidTokens.length} invalid tokens`,
          );
        }
      }

      return {success: true, sentCount: response.successCount};
    } catch (error) {
      logger.error("[Chat] Error sending notification:", error);
      throw error;
    }
  }
);
