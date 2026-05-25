# Firebase Authentication configuration

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

# Google Sign-In provider
resource "google_identity_platform_default_supported_idp_config" "google" {
  provider = google-beta
  project  = var.gcp_project_id
  idp_id   = "google.com"
  enabled  = true

  client_id     = data.google_firebase_web_app_config.default.oauth_client_id
  client_secret = "" # Managed by Firebase automatically for Google provider

  depends_on = [google_identity_platform_config.default]
}
