# Firestore database
# Already exists — use import block

import {
  to = google_firestore_database.default
  id = "projects/bad-cost/databases/(default)"
}

resource "google_firestore_database" "default" {
  provider    = google-beta
  project     = var.gcp_project_id
  name        = "(default)"
  location_id = var.gcp_region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_firebase_project.default]

  lifecycle {
    ignore_changes = [location_id]
  }
}

# TTL policy — auto-delete games 3 months after game date
resource "google_firestore_field" "games_ttl" {
  provider   = google-beta
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "games"
  field      = "expireAt"

  ttl_config {}

  depends_on = [google_firestore_database.default]
}

# Firestore security rules
resource "google_firebaserules_ruleset" "firestore" {
  provider = google-beta
  project  = var.gcp_project_id

  source {
    files {
      name    = "firestore.rules"
      content = file("${path.module}/firestore.rules")
    }
  }

  depends_on = [google_firestore_database.default]
}

resource "google_firebaserules_release" "firestore" {
  provider     = google-beta
  project      = var.gcp_project_id
  name         = "cloud.firestore/database/${google_firestore_database.default.name}/documents"
  ruleset_name = google_firebaserules_ruleset.firestore.name

  depends_on = [google_firebaserules_ruleset.firestore]
}
