# Token Tracker Backend

## Description

A Node.js application that tracks tokens on blockchain networks, providing a robust backend infrastructure for token monitoring and data management.

## Project Structure

.
├── src/
│ ├── api/
│ │ ├── controllers/ # Request handlers
│ │ ├── routes/ # API route definitions
│ │ └── services/ # Business logic layer
│ ├── config/ # Configuration files
│ ├── database/ # Database related files
│ │ ├── models/ # SQL schema definitions
│ │ ├── connection.js # Database connection setup
│ │ └── operations.js # Database operations
│ ├── messageQueue/ # Queue processing system
│ │ ├── queue.js
│ │ └── workers.js
│ ├── services/ # External service integrations
│ │ └── raydium/ # Raydium-specific functionality
│ └── utils/ # Utility functions
├── errors/ # Error definitions
└── middlewares/ # Express middleware

## Features

-   Token tracking and monitoring
-   Message queue system for asynchronous processing
-   SQL database integration
-   RESTful API endpoints
-   Raydium service integration
-   Robust error handling
-   Custom middleware implementation

## Prerequisites

-   Node.js
-   PostgresSQL Database
-   Message Queue System
