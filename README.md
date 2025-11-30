# OSMS Fashion Store - Full-Stack E-commerce Platform

This repository contains the source code for the OSMS Fashion Store, a modern, high-performance e-commerce web application built with a full-stack architecture.

## Project Overview

The application is architected as a monorepo with two main components:
-   **`frontend`**: A client-side application built with React, Vite, and TypeScript, responsible for the user interface and user experience.
-   **`backend`**: A server-side application built with Node.js, Express, and TypeScript, providing a RESTful API to interact with the database and handle business logic.

## Technology Stack

-   **Frontend**:
    -   React 18 with TypeScript
    -   Vite for fast development and bundling
    -   Tailwind CSS for styling
    -   React Context for state management (Auth, Cart)

-   **Backend**:
    -   Node.js with Express.js and TypeScript
    -   PostgreSQL for the relational database
    -   Redis for high-performance caching
    -   Faker.js for seeding realistic initial data

-   **DevOps & Tooling**:
    -   Docker & Docker Compose for containerizing and managing services (Backend, PostgreSQL, Redis)
    -   VS Code for development

## Features

-   **Full-stack Architecture**: Decoupled frontend and backend for scalability and maintainability.
-   **User Authentication**: Secure login and registration system.
-   **Role-Based Access Control**: Differentiated dashboards and capabilities for Users and Admins.
-   **Product Management (Admin)**: Full CRUD (Create, Read, Update, Delete) functionality for products.
-   **User Management (Admin)**: Full CRUD functionality for users, including promoting users to admin.
-   **Order Management (Admin)**: View all orders and update their status.
-   **Activity Logging (Admin)**: Track all significant actions within the application.
-   **High-Performance Search**: Advanced PostgreSQL indexing (`unaccent`) for fast, accent-insensitive product search.
-   **Shopping Cart & Checkout**: A complete and persistent shopping experience with voucher support.
-   **Multiple Payment Methods**: Supports both Cash on Delivery (COD) and a simulated Online Payment gateway flow.
-   **Persistent Database**: All data is stored in a PostgreSQL database managed by Docker.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [Docker](https://www.docker.com/products/docker-desktop/)
-   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Getting Started

Follow these steps to get the entire application running locally.

### 1. Start All Services (Backend, DB, Cache)

Open a terminal in the project's root directory and run:
```bash
docker-compose up -d --build
```
This single command will:
-   Build the backend Node.js application into a Docker image.
-   Start containers for the backend, PostgreSQL database, and Redis cache.
-   The backend API will be available at `http://localhost:3001`.
-   It will automatically connect to the database, create tables, and seed initial data if the database is empty.

### 2. Run the Frontend Application

1.  Open a **new terminal** and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install the necessary dependencies:
    ```bash
    npm install
    ```

3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    Vite will start the application, typically on `http://localhost:5173`.

### 3. Access the Application

-   Open your web browser and navigate to `http://localhost:5173`.
-   You can now interact with the OSMS Fashion Store.

### Default Credentials

-   **Admin Account**:
    -   **Email**: `admin@osms.com`
    -   **Password**: `admin123`
-   **User Account**:
    -   **Email**: `user1@example.com`
    -   **Password**: `user123`

---

## Architecture for Scalability & Availability

While the current setup is ideal for local development, deploying to production and handling high-traffic events like a "flash sale" requires a more robust architecture. The following principles outline a roadmap for achieving high scalability and availability on a cloud platform (e.g., AWS, GCP, Azure).

### 1. Load Balancing & Auto-Scaling

-   **Load Balancer**: Instead of a single backend server, deploy multiple instances of the Node.js application. A Load Balancer (like AWS ELB or Nginx) should be placed in front of them to distribute incoming user traffic evenly. This prevents any single server from being overwhelmed.
-   **Auto-Scaling Group**: The backend instances should be managed by an Auto-Scaling Group. This group will automatically add more server instances when traffic is high (e.g., CPU utilization > 70%) and remove them when traffic subsides. This is the key to handling sudden traffic spikes during events like a flash sale without manual intervention.

### 2. Database Scaling

-   **Read Replicas**: The single PostgreSQL instance is a potential bottleneck. The architecture should be evolved to a primary-replica model.
    -   The **Primary** database handles all write operations (creating orders, updating user profiles).
    -   One or more **Read Replicas** are created, which continuously sync with the primary. All read-heavy operations (fetching products, categories, search results) should be directed to these replicas. This drastically reduces the load on the primary database, ensuring that critical write operations remain fast.
-   **Connection Pooling**: Implement a connection pooler like `PgBouncer` to manage database connections efficiently, reducing the overhead of establishing new connections for each request.

### 3. Advanced Caching Strategy

-   **Granular Caching with Redis**: Expand the use of Redis beyond just basic product lists. Cache API query results for paginated pages, search terms, and category filters. Also, consider caching individual product details for frequently viewed items.
-   **Content Delivery Network (CDN)**: Use a CDN (like AWS CloudFront or Cloudflare) to serve static assets (images, CSS, JavaScript files). The CDN caches these files in edge locations around the world, closer to users, which dramatically improves frontend load times and reduces the load on the backend server.

### 4. Stateless Backend

The current Express server is designed to be **stateless**. User session information is managed on the client-side and validated via headers (`x-user-email`), not stored in server memory. This is a critical prerequisite for horizontal scaling, as any server instance can handle a request from any user at any time.

### 5. High Availability & Fault Tolerance

-   **Multi-AZ Deployment**: Deploy all components (load balancers, backend instances, database primary and replicas) across multiple Availability Zones (AZs). An AZ is a distinct data center within a cloud provider's region. This ensures that if one data center experiences an outage, the application remains operational from another AZ.
-   **Automated Database Failover**: Configure the database so that if the primary instance fails, a read replica is automatically promoted to become the new primary, ensuring minimal downtime.
-   **Health Checks**: The load balancer should continuously perform health checks on the backend instances and automatically route traffic away from any unhealthy instances.

By implementing these architectural patterns, the OSMS Fashion Store can evolve from a development project into a robust, production-grade platform capable of serving thousands of users reliably.