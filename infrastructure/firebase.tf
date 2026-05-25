# Firebase project and web app configuration

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.gcp_project_id
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.gcp_project_id
  display_name = "BadCost Web"

  depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.gcp_project_id
  web_app_id = google_firebase_web_app.default.app_id
}
