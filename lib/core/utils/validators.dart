/// Input validation utilities for NearMe
class Validators {
  Validators._();

  /// Validates email format
  static String? validateEmail(String email) {
    if (email.trim().isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(email)) {
      return 'Enter a valid email address';
    }
    return null;
  }

  /// Validates password strength
  static String? validatePassword(String password, {int minLength = 8}) {
    if (password.isEmpty) {
      return 'Password is required';
    }
    if (password.length < minLength) {
      return 'Password must be at least $minLength characters';
    }
    return null;
  }

  /// Validates password confirmation
  static String? validatePasswordConfirm(String password, String confirm) {
    if (confirm.isEmpty) {
      return 'Please confirm your password';
    }
    if (password != confirm) {
      return 'Passwords do not match';
    }
    return null;
  }

  /// Validates name
  static String? validateName(String name) {
    if (name.trim().isEmpty) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Name must not exceed 50 characters';
    }
    return null;
  }

  /// Validates age (must be 18+)
  static String? validateAge(DateTime? birthDate) {
    if (birthDate == null) {
      return 'Birth date is required';
    }
    final age = _calculateAge(birthDate);
    if (age < 18) {
      return 'You must be at least 18 years old';
    }
    if (age > 120) {
      return 'Please enter a valid birth date';
    }
    return null;
  }

  /// Validates bio length
  static String? validateBio(String? bio, {int maxLength = 500}) {
    if (bio == null) return null;
    if (bio.length > maxLength) {
      return 'Bio must not exceed $maxLength characters';
    }
    return null;
  }

  /// Calculates age from birth date
  static int _calculateAge(DateTime birthDate) {
    final today = DateTime.now();
    var age = today.year - birthDate.year;
    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  /// Checks if email format is valid (fast check)
  static bool isEmailValid(String email) => validateEmail(email) == null;

  /// Checks if password is strong enough
  static bool isPasswordStrong(String password) {
    if (password.length < 12) return false;
    return password.contains(RegExp(r'[A-Z]')) &&
        password.contains(RegExp(r'[a-z]')) &&
        password.contains(RegExp(r'[0-9]')) &&
        password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));
  }

  /// Checks if password is at least acceptable
  static bool isPasswordAcceptable(String password) {
    return password.length >= 8;
  }

  /// Calculates age from birth date
  static int calculateAge(DateTime birthDate) {
    return _calculateAge(birthDate);
  }
}
