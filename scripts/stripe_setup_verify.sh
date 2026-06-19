#!/bin/bash

################################################################################
# Stripe Setup Verification Script
#
# Usage: bash scripts/stripe_setup_verify.sh
#
# This script checks if your Stripe configuration is correct and validates:
# - Environment variables are set
# - Required npm packages are installed
# - Flutter dependencies are installed
# - Endpoints are reachable
# - Stripe connectivity works
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_check() {
    echo -e "${YELLOW}→${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

# Check if file exists
check_file_exists() {
    if [ -f "$1" ]; then
        print_pass "File exists: $1"
    else
        print_fail "File missing: $1"
    fi
}

# Check environment variable
check_env_var() {
    local var_name=$1
    if [ -z "${!var_name}" ]; then
        print_fail "Environment variable not set: $var_name"
    else
        print_pass "Environment variable set: $var_name"
    fi
}

# Main script starts here
print_header "STRIPE CONFIGURATION VERIFICATION"

echo ""
print_check "Checking directory structure..."

# Check if we're in the right directory
if [ ! -f "pubspec.yaml" ] && [ ! -f "package.json" ]; then
    print_fail "Not in project root (missing pubspec.yaml or package.json)"
    exit 1
fi
print_pass "In correct project directory"

echo ""
print_header "1. BACKEND CONFIGURATION (.env)"

if [ -f "server/.env" ]; then
    print_pass "server/.env exists"

    # Check each required variable
    print_check "Checking Stripe environment variables..."

    source server/.env 2>/dev/null || true

    if [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then
        print_pass "STRIPE_PUBLISHABLE_KEY is set"
        if [[ $STRIPE_PUBLISHABLE_KEY == pk_test_* ]]; then
            print_pass "STRIPE_PUBLISHABLE_KEY is in TEST mode"
        elif [[ $STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
            print_warning "STRIPE_PUBLISHABLE_KEY is in LIVE mode (make sure this is intentional)"
        else
            print_fail "STRIPE_PUBLISHABLE_KEY format invalid"
        fi
    else
        print_fail "STRIPE_PUBLISHABLE_KEY not set in server/.env"
    fi

    if [ -n "$STRIPE_SECRET_KEY" ]; then
        print_pass "STRIPE_SECRET_KEY is set"
        if [[ $STRIPE_SECRET_KEY == sk_test_* ]]; then
            print_pass "STRIPE_SECRET_KEY is in TEST mode"
        elif [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
            print_warning "STRIPE_SECRET_KEY is in LIVE mode (make sure this is intentional)"
        else
            print_fail "STRIPE_SECRET_KEY format invalid"
        fi
    else
        print_fail "STRIPE_SECRET_KEY not set in server/.env"
    fi

    if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
        print_pass "STRIPE_WEBHOOK_SECRET is set"
        if [[ $STRIPE_WEBHOOK_SECRET == whsec_test_* ]]; then
            print_pass "STRIPE_WEBHOOK_SECRET is in TEST mode"
        elif [[ $STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
            print_warning "STRIPE_WEBHOOK_SECRET format OK but verify mode"
        else
            print_fail "STRIPE_WEBHOOK_SECRET format might be invalid"
        fi
    else
        print_fail "STRIPE_WEBHOOK_SECRET not set in server/.env"
    fi

else
    print_fail "server/.env does not exist"
    print_info "Create it using: touch server/.env"
fi

echo ""
print_header "2. BACKEND DEPENDENCIES"

print_check "Checking npm stripe package..."
if [ -f "server/package.json" ]; then
    if grep -q "\"stripe\"" server/package.json; then
        print_pass "stripe npm package is in package.json"
        if [ -d "server/node_modules/stripe" ]; then
            print_pass "stripe npm package is installed (node_modules)"
        else
            print_warning "stripe package listed but not installed (run: cd server && npm install)"
        fi
    else
        print_warning "stripe npm package not found in package.json (run: cd server && npm install stripe)"
    fi
else
    print_fail "server/package.json not found"
fi

echo ""
print_header "3. FLUTTER DEPENDENCIES"

print_check "Checking flutter_stripe in pubspec.yaml..."
if [ -f "pubspec.yaml" ]; then
    if grep -q "flutter_stripe" pubspec.yaml; then
        print_pass "flutter_stripe is in pubspec.yaml"
        if [ -d ".dart_tool" ]; then
            print_pass "Flutter packages directory exists"
        else
            print_warning "Run 'flutter pub get' to download packages"
        fi
    else
        print_warning "flutter_stripe not in pubspec.yaml (run: flutter pub add flutter_stripe)"
    fi
else
    print_fail "pubspec.yaml not found"
fi

echo ""
print_header "4. STRIPE ACCOUNT STATUS"

print_check "Verifying Stripe account setup requirements..."
print_info "Manually verify in Stripe Dashboard:"
echo "  1. Go to: https://dashboard.stripe.com"
echo "  2. Check toggle is set to TEST mode (top right)"
echo "  3. Verify Stripe Identity is enabled in Apps"
echo "  4. Confirm webhooks are configured in Developers → Webhooks"
echo ""

echo ""
print_header "5. LOCAL CONNECTIVITY TEST"

print_check "Testing connection to localhost:3000..."
if command -v curl &> /dev/null; then
    if timeout 2 bash -c 'echo > /dev/tcp/localhost/3000' 2>/dev/null; then
        print_pass "Backend server is running on localhost:3000"
    else
        print_warning "Backend server not running on localhost:3000"
        print_info "Start it with: cd server && npm run start:dev"
    fi
else
    print_warning "curl not available, skipping connectivity check"
fi

echo ""
print_header "6. STRIPE CLI STATUS"

print_check "Checking if Stripe CLI is installed..."
if command -v stripe &> /dev/null; then
    print_pass "Stripe CLI is installed"

    print_check "Checking if Stripe CLI is authenticated..."
    if stripe api resources 2>/dev/null > /dev/null; then
        print_pass "Stripe CLI is authenticated"
    else
        print_warning "Stripe CLI not authenticated (run: stripe login)"
    fi
else
    print_warning "Stripe CLI not installed"
    print_info "Install with: brew install stripe/stripe-cli/stripe (macOS)"
    print_info "Or visit: https://stripe.com/docs/stripe-cli"
fi

echo ""
print_header "7. CONFIGURATION TEMPLATE"

print_check "Generating .env template for reference..."
cat > /tmp/stripe_env_template.txt << 'EOF'
# ──────────────────────────────────────────
# STRIPE CONFIGURATION
# ──────────────────────────────────────────

# Test mode keys (starts with pk_test_, sk_test_)
STRIPE_PUBLISHABLE_KEY=pk_test_51OQ1234567890
STRIPE_SECRET_KEY=sk_test_51OQ1234567890
STRIPE_WEBHOOK_SECRET=whsec_test_51OQ1234567890

# Mode: test or live
STRIPE_MODE=test

# Webhook URL (where Stripe sends events)
WEBHOOK_URL=https://yourdomain.com

# ──────────────────────────────────────────
# DATABASE (existing)
# ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/nearme

# ... other existing variables ...
EOF

print_pass "Template saved to /tmp/stripe_env_template.txt"
print_info "Use it to update your server/.env file"

echo ""
print_header "VERIFICATION SUMMARY"

echo ""
echo -e "${GREEN}Passed:${NC} $CHECKS_PASSED"
echo -e "${RED}Failed:${NC} $CHECKS_FAILED"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    print_pass "All checks passed! ✨"
    echo ""
    print_info "Next steps:"
    echo "  1. Review .env template: cat /tmp/stripe_env_template.txt"
    echo "  2. Start backend: cd server && npm run start:dev"
    echo "  3. Test Stripe CLI: stripe listen --forward-to localhost:3000/verification/stripe/webhook"
    echo "  4. Continue with Phase 1: IMPLEMENTATION_CHECKLIST.md"
    exit 0
else
    echo ""
    print_warning "Some checks failed. Please review and fix the issues above."
    echo ""
    print_info "For help, see: STRIPE_SETUP_GUIDE.md"
    exit 1
fi
