# infrastructure/terraform/main.tf

provider "aws" {
  region = var.aws_region
}

# 1. Rede e Segurança
module "network" {
  source = "./modules/network"
  project_name = "link-management"
}

# 2. Servidor de Aplicação (EC2 / VPS)
module "app_server" {
  source = "./modules/compute"
  instance_type = "t3.small"
  subnet_id     = module.network.public_subnet_id
  security_group_id = module.network.app_sg_id
}

# infrastructure/terraform/variables.tf
variable "aws_region" {
  default = "us-east-1"
}

# infrastructure/terraform/outputs.tf
output "app_ip" {
  value = module.app_server.public_ip
}
