# Projects

## Teleport for Kubernetes

**2024 – 2024**  
Associated with Giant Swarm

At Giant Swarm, as part of Team BigMac, I led the effort to implement Teleport as the default access mechanism for Kubernetes and SSH across all Cluster API-based Kubernetes clusters.

During this implementation, I developed and open-sourced the `teleport-operator` using Go and Kubebuilder, created Helm charts for Teleport agents, integrated Teleport into our E2E cluster testing framework, and contributed to the integration of CAPI providers, including CAPA, CAPZ, CAPV, and CAPVCD.

**Overall Impact:** Teleport significantly boosted engineer productivity by replacing the previous VPN-based solution.

**Business Impact:** By eliminating the need for customers to open incoming ports, Teleport simplified network architecture, streamlined the network layout, and improved the onboarding process.

**Skills:** Teleport, Go (Programming Language), +2 skills

**Related projects:**

- [GitHub - giantswarm/teleport-tbot](https://github.com/giantswarm/teleport-tbot): Helm chart for the `teleport-tbot` app running in Giant Swarm clusters for internal use only.
- [GitHub - giantswarm/teleport-kube-agent-app](https://github.com/giantswarm/teleport-kube-agent-app)
- [GitHub - giantswarm/teleport-operator](https://github.com/giantswarm/teleport-operator): Teleport Operator for Giant Swarm.

## GitHub Actions for CI/CD

**2020 – 2020**  
Associated with CloudFactory

In this project, I helped implement a CI/CD pipeline solution for microservices powered by AWS ECS and serverless components powered by AWS Lambda.

Since the company relied heavily on GitHub to manage source code, GitHub Actions provided tight integration between source control, integration tests, and deployment in a single place. It also brought much-needed transparency to developers around the overall CI/CD pipeline, reducing the friction caused by our previous AWS CodeBuild-based pipeline.

## Scalability and Reliability of Rocket.Chat

**2020 – 2020**  
Associated with CloudFactory

When the COVID-19 pandemic forced the company to move to distributed work, virtual communication increased significantly. One of our core communication tools became unreliable, with constant random outages affecting the business.

I initiated and proposed a solution to improve the system’s reliability and scalability. I then led the project for a month, implementing performance and scalability improvements, including:

- On-demand EC2 auto-scaling during peak hours.
- Improved web performance using AWS Global Accelerator.
- Critical metrics and monitoring with Prometheus and Grafana.
- Automated Rocket.Chat Meteor build and deployment using AWS CodeBuild and EC2 CodeDeploy.
- Offloading application read and write operations to MongoDB primary and secondary replica members by extending open-source Rocket.Chat with this functionality.

## Secure and Scalable Networking Design for Microservice Architecture

**2020 – 2020**  
Associated with CloudFactory

I was tasked with implementing a secure and scalable AWS VPC networking design for a large microservice architecture powering the core business platform.

We accomplished the following:

- Segregated microservice subsystem resources into stateful and stateless subnets secured by network ACLs and security groups.
- Isolated inter-service traffic within the VPC and limited microservice exposure to the internet using AWS PrivateLink VPC gateway and interface endpoints.

I wrote a blog post sharing what I learned from the project:

- [Design secure, scalable VPC for microservice architecture](https://medium.com/@ptuladhar3/design-secure-scalable-vpc-for-micro-service-architecture-1b58fbf128f)

## One-Click Automated System for Developers to Spin Up Multiple Development Environments

**2019 – 2019**  
Associated with CloudFactory

The automated system was built on AWS CodeBuild using GNU Make, Bash scripting, Git, and related tooling.

The system helped developers quickly spin up a large, interdependent microservices platform with minimal friction.

## Automated Cleanup of Development AWS Account Resources

**2019 – 2019**

As part of a cloud cost-saving initiative, I led a project to clean up AWS resources at the end of each Scrum sprint.

The cleanup process also helped us test the resiliency of our infrastructure-as-code and our ability to tear down and recreate development environments, while helping the company reduce cloud costs.

For this project, I used the open-source AWS cleanup tool `aws-nuke`.

## Centralization of Multi-Account AWS IAM

**2019 – 2019**  
Associated with CloudFactory

I was tasked with centralizing multi-account AWS IAM users, roles, and policies across the engineering department. Previously, IAM roles, groups, users, and policies were scattered and lacked standardization.

Alongside centralizing and standardizing IAM across accounts, we practiced infrastructure-as-code using CloudFormation stacks. This allowed us to version-control changes and manage new updates more easily.

## Production-Grade Browser Update System

**2019 – 2019**  
Associated with CloudFactory

I helped design, architect, and implement a production-grade Browser Update Server that was critical to business operations. The project successfully migrated from the old environment to a new environment with zero downtime, bringing improved scalability, reliability, backups, and observability.

Before this project, the Browser Update system was packaged into a single monolithic EC2 server hosting multiple Docker containers. It had no backup, limited horizontal EC2 scaling, and poor visibility into system performance.

I helped migrate the Docker containers to relevant AWS services, including AWS ECS, RDS for PostgreSQL, ElastiCache for Redis, CloudFormation, and CloudWatch.

The new environment enabled reliable browser updates and allowed services to scale independently.

I also wrote a blog post sharing what I learned with the open-source community:

- [Deploy scalable and highly available Web Omaha Server on AWS Cloud](https://medium.com/@ptuladhar3/deploy-scalable-and-highly-available-web-app-omaha-server-on-aws-cloud-69e26df7c85b)

## Disaster Recovery Plan for Critical Self-Managed MySQL and MongoDB Data Stores

**2018 – 2018**  
Associated with CloudFactory

I was tasked with creating a disaster recovery plan for critical self-managed MySQL and MongoDB data stores hosted on EC2 over EBS, RAID, and LVM.

Alongside comprehensive disaster recovery documentation, we ran a successful dry run simulating a disaster scenario.

## One-Click Automated Proxy Server Deployment System

**2015 – 2015**  
Associated with Appstractor Corporation

I proposed an automated deployment solution and led its development.

I worked independently on the design, architecture, and implementation of the complete deployment system.

I evaluated various open-source technologies and selected the tools that best fit the requirements, including:

- Rundeck
- Python and Bash
- Ansible

The system helped the company deliver a new proxy in 10–15 minutes, compared with hours using the previous shell-script-based deployment system. Rundeck’s flexibility also allowed us to add functionality such as a self-service UI for running jobs, applying security patches, and triggering ad hoc commands across a large pool of servers.

## Scalable Proxy Health Monitoring System

**2015 – 2015**  
Associated with Appstractor Corporation

I championed and led the development of a scalable and reliable proxy health monitoring system. It allowed the company to monitor and troubleshoot a large pool of proxy servers representing approximately 35,000–40,000 unique IP addresses.

**Frontend:**

- HTML
- Bootstrap
- JavaScript and AngularJS

**Backend:**

- PHP
- Python
- HAProxy

**Datastore:**

- MySQL

## Self-Managed AWS EC2 Management Dashboard for Developers

**2014 – 2014**  
Associated with Leapfrog Technology, Inc.

I created a web interface that helped developers self-manage project-based EC2 virtual machines on AWS. The system was built using Python, `aws-cli`, and the Mako templating library.

## Mass DNS Resolver Tool

**2013 – 2013**  
Associated with NepalLink Network

I built a Python tool using the `adns` library to resolve DNS records for large numbers of domains.

## Multi-Cloud Server Provisioning Tool

**2013 – 2013**  
Associated with NepalLink Network

I built a Python tool using the open-source Libcloud library to manage VPS servers hosted on Linode and DigitalOcean.

## XMLRPC-Based Fast and Efficient Server Management Tool

**2013 – 2013**  
Associated with NepalLink Network

I built a Python tool using the Twisted framework to manage more than 30 servers.

## cPanel Abuse Management

**2013 – 2013**  
Associated with NepalLink Network

In this project, I created a tool called “Abuse Management Scripts,” consisting of multiple scripts for managing abusive cPanel users. The project is now open source.

## Teleport Operator for Kubernetes

Associated with Giant Swarm

The `teleport-operator` is a Kubernetes operator tailored for Giant Swarm clusters. It enables seamless integration with Teleport for enhanced access management, allowing Giant Swarm clusters to be managed and accessed through Teleport while simplifying access controls.

**Skills:** Teleport, Go (Programming Language), +3 skills

**Related project:**

- [GitHub - giantswarm/teleport-operator](https://github.com/giantswarm/teleport-operator): Teleport Operator for Giant Swarm.
