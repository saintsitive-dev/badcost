variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for resources"
  type        = string
  default     = "asia-southeast1"
}

variable "app_domain" {
  description = "Application domain (e.g. badcost-prod.web.app)"
  type        = string
  default     = ""
}
