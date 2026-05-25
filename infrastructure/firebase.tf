# Firebase project and web app configuration
# Import blocks for already-existing resources (Terraform 1.5+)

import {
  to = google_firebase_project.default
  id = "projects/bad-cost"
}

import {
  to = google_firebase_web_app.default
  id = "projects/bad-cost/webApps/1:287534641227:web:e2e0f176f5149beba61dce"
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.gcp_project_id
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.gcp_project_id
  display_name = "BadCost Web"

  depends_on = [google_firebase_project.default]

  lifecycle {
    ignore_changes = [display_name]
  }
}

data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.gcp_project_id
  web_app_id = google_firebase_web_app.default.app_id
}
