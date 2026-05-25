output "firebase_web_app_id" {
  description = "Firebase Web App ID"
  value       = google_firebase_web_app.default.app_id
}

output "firebase_hosting_url" {
  description = "Firebase Hosting default URL"
  value       = "https://${var.gcp_project_id}.web.app"
}

output "firestore_database" {
  description = "Firestore database name"
  value       = google_firestore_database.default.name
}
