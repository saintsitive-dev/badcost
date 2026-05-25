# Firebase Authentication configuration
# Already exists — use import block to bring into state

import {
  to = google_identity_platform_config.default
  id = "projects/bad-cost/config"
}

resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.gcp_project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = false
      password_required = false
    }
  }

  depends_on = [google_firebase_project.default]
}

# Note: Google Sign-In provider is configured manually in Firebase Console
