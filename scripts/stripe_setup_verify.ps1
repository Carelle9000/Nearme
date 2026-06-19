# Stripe Setup Verification Script for Windows PowerShell
#
# Usage: .\scripts\stripe_setup_verify.ps1
#
# This script checks if your Stripe configuration is correct

param(
    [switch]$ShowTemplate = $false
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"

$ChecksPassed = 0
$ChecksFailed = 0

function Print-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "================================" -ForegroundColor $Blue
    Write-Host $Text -ForegroundColor $Blue
    Write-Host "================================" -ForegroundColor $Blue
}

function Print-Check {
    param([string]$Text)
    Write-Host "→ $Text" -ForegroundColor $Yellow
}

function Print-Pass {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor $Green
    $script:ChecksPassed++
}

function Print-Fail {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor $Red
    $script:ChecksFailed++
}

function Print-Info {
    param([string]$Text)
    Write-Host "ℹ $Text" -ForegroundColor $Blue
}

function Print-Warning {
    param([string]$Text)
    Write-Host "⚠  $Text" -ForegroundColor $Yellow
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Print-Header "STRIPE CONFIGURATION VERIFICATION"

# 1. Check directory structure
Write-Host ""
Print-Check "Checking directory structure..."

if ((Test-Path "pubspec.yaml") -or (Test-Path "package.json")) {
    Print-Pass "In correct project directory"
} else {
    Print-Fail "Not in project root (missing pubspec.yaml or package.json)"
    exit 1
}

# 2. Check .env file
Print-Header "1. BACKEND CONFIGURATION (.env)"

if (Test-Path "server\.env") {
    Print-Pass "server\.env exists"

    # Read .env file
    Print-Check "Checking Stripe environment variables..."
    $envContent = Get-Content "server\.env" | ConvertFrom-StringData

    # Check STRIPE_PUBLISHABLE_KEY
    if ($envContent["STRIPE_PUBLISHABLE_KEY"]) {
        Print-Pass "STRIPE_PUBLISHABLE_KEY is set"
        if ($envContent["STRIPE_PUBLISHABLE_KEY"] -like "pk_test_*") {
            Print-Pass "STRIPE_PUBLISHABLE_KEY is in TEST mode"
        } elseif ($envContent["STRIPE_PUBLISHABLE_KEY"] -like "pk_live_*") {
            Print-Warning "STRIPE_PUBLISHABLE_KEY is in LIVE mode (verify this is intentional)"
        } else {
            Print-Fail "STRIPE_PUBLISHABLE_KEY format may be invalid"
        }
    } else {
        Print-Fail "STRIPE_PUBLISHABLE_KEY not set in server\.env"
    }

    # Check STRIPE_SECRET_KEY
    if ($envContent["STRIPE_SECRET_KEY"]) {
        Print-Pass "STRIPE_SECRET_KEY is set"
        if ($envContent["STRIPE_SECRET_KEY"] -like "sk_test_*") {
            Print-Pass "STRIPE_SECRET_KEY is in TEST mode"
        } elseif ($envContent["STRIPE_SECRET_KEY"] -like "sk_live_*") {
            Print-Warning "STRIPE_SECRET_KEY is in LIVE mode (verify this is intentional)"
        } else {
            Print-Fail "STRIPE_SECRET_KEY format may be invalid"
        }
    } else {
        Print-Fail "STRIPE_SECRET_KEY not set in server\.env"
    }

    # Check STRIPE_WEBHOOK_SECRET
    if ($envContent["STRIPE_WEBHOOK_SECRET"]) {
        Print-Pass "STRIPE_WEBHOOK_SECRET is set"
        if ($envContent["STRIPE_WEBHOOK_SECRET"] -like "whsec_test_*") {
            Print-Pass "STRIPE_WEBHOOK_SECRET is in TEST mode"
        } elseif ($envContent["STRIPE_WEBHOOK_SECRET"] -like "whsec_*") {
            Print-Pass "STRIPE_WEBHOOK_SECRET format looks correct"
        } else {
            Print-Warning "STRIPE_WEBHOOK_SECRET format may be invalid"
        }
    } else {
        Print-Fail "STRIPE_WEBHOOK_SECRET not set in server\.env"
    }

} else {
    Print-Fail "server\.env does not exist"
    Print-Info "Create it using: New-Item -Path server\.env -ItemType File"
}

# 3. Check npm packages
Print-Header "2. BACKEND DEPENDENCIES"

Print-Check "Checking npm stripe package..."
if (Test-Path "server\package.json") {
    $packageJson = Get-Content "server\package.json" -Raw
    if ($packageJson -like "*`"stripe`"*") {
        Print-Pass "stripe npm package is in package.json"
        if (Test-Path "server\node_modules\stripe") {
            Print-Pass "stripe npm package is installed (node_modules)"
        } else {
            Print-Warning "stripe package listed but not installed. Run: cd server && npm install"
        }
    } else {
        Print-Warning "stripe npm package not found. Run: cd server && npm install stripe"
    }
} else {
    Print-Fail "server\package.json not found"
}

# 4. Check Flutter dependencies
Print-Header "3. FLUTTER DEPENDENCIES"

Print-Check "Checking flutter_stripe in pubspec.yaml..."
if (Test-Path "pubspec.yaml") {
    $pubspec = Get-Content "pubspec.yaml" -Raw
    if ($pubspec -like "*flutter_stripe*") {
        Print-Pass "flutter_stripe is in pubspec.yaml"
        if (Test-Path ".dart_tool") {
            Print-Pass "Flutter packages directory exists"
        } else {
            Print-Warning "Run 'flutter pub get' to download packages"
        }
    } else {
        Print-Warning "flutter_stripe not in pubspec.yaml. Run: flutter pub add flutter_stripe"
    }
} else {
    Print-Fail "pubspec.yaml not found"
}

# 5. Manual Stripe Dashboard checks
Print-Header "4. STRIPE ACCOUNT STATUS"

Print-Check "Verifying Stripe account setup requirements..."
Print-Info "Manually verify in Stripe Dashboard:"
Write-Host "  1. Go to: https://dashboard.stripe.com" -ForegroundColor Gray
Write-Host "  2. Check toggle is set to TEST mode (top right)" -ForegroundColor Gray
Write-Host "  3. Verify Stripe Identity is enabled in Apps" -ForegroundColor Gray
Write-Host "  4. Confirm webhooks are configured in Developers → Webhooks" -ForegroundColor Gray

# 6. Test localhost connectivity
Print-Header "5. LOCAL CONNECTIVITY TEST"

Print-Check "Testing connection to localhost:3000..."
try {
    $socket = New-Object System.Net.Sockets.TcpClient
    $socket.ConnectAsync("127.0.0.1", 3000).Wait(2000)

    if ($socket.Connected) {
        Print-Pass "Backend server is running on localhost:3000"
        $socket.Close()
    } else {
        Print-Warning "Backend server not running on localhost:3000"
        Print-Info "Start it with: cd server && npm run start:dev"
    }
} catch {
    Print-Warning "Backend server not running on localhost:3000"
    Print-Info "Start it with: cd server && npm run start:dev"
}

# 7. Check Stripe CLI
Print-Header "6. STRIPE CLI STATUS"

Print-Check "Checking if Stripe CLI is installed..."
$stripePath = Get-Command stripe -ErrorAction SilentlyContinue
if ($stripePath) {
    Print-Pass "Stripe CLI is installed"

    Print-Check "Checking if Stripe CLI is authenticated..."
    try {
        $output = & stripe api resources 2>&1
        if ($LASTEXITCODE -eq 0) {
            Print-Pass "Stripe CLI is authenticated"
        } else {
            Print-Warning "Stripe CLI not authenticated. Run: stripe login"
        }
    } catch {
        Print-Warning "Stripe CLI not authenticated. Run: stripe login"
    }
} else {
    Print-Warning "Stripe CLI not installed"
    Print-Info "Install with: choco install stripe-cli"
    Print-Info "Or download from: https://stripe.com/docs/stripe-cli"
}

# 8. Show template if requested
if ($ShowTemplate) {
    Print-Header "7. CONFIGURATION TEMPLATE"

    $template = @"
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
"@

    Write-Host $template -ForegroundColor Gray
}

# Summary
Print-Header "VERIFICATION SUMMARY"

Write-Host ""
Write-Host "Passed: $ChecksPassed" -ForegroundColor $Green
Write-Host "Failed: $ChecksFailed" -ForegroundColor $Red

if ($ChecksFailed -eq 0) {
    Write-Host ""
    Print-Pass "All checks passed! ✨"
    Write-Host ""
    Print-Info "Next steps:"
    Write-Host "  1. Show .env template: .\scripts\stripe_setup_verify.ps1 -ShowTemplate" -ForegroundColor Gray
    Write-Host "  2. Start backend: cd server && npm run start:dev" -ForegroundColor Gray
    Write-Host "  3. Test Stripe CLI: stripe listen --forward-to localhost:3000/verification/stripe/webhook" -ForegroundColor Gray
    Write-Host "  4. Continue with Phase 1: IMPLEMENTATION_CHECKLIST.md" -ForegroundColor Gray
    exit 0
} else {
    Write-Host ""
    Print-Warning "Some checks failed. Please review and fix the issues above."
    Write-Host ""
    Print-Info "For help, see: STRIPE_SETUP_GUIDE.md"
    exit 1
}
