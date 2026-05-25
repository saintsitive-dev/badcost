terraform {
  # Remote state in GCS (requires Blaze plan with billing enabled):
  # backend "gcs" {
  #   bucket = "badcost-terraform-state"
  #   prefix = "prod"
  # }

  # Local state (no billing required — uncomment GCS above when ready)

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "google-beta" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
