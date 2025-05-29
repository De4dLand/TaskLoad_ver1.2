1. The framework version and dependencies used in the project.
2. Details on the testing framework.
3. Avoid using certain APIs.


---

## Project Rules: [TaskLoad]

**Project Goal:** To develop a robust, scalable, and high-performance application that leverages modern web technologies and AI to deliver an exceptional user experience.

---

### I. Core Principles

1.  **User-Centric Design:** Every feature and design decision must prioritize the user's needs, ease of use, and overall satisfaction.
2.  **Performance First:** Optimize for speed and responsiveness at every layer of the application.
3.  **Scalability & Maintainability:** Build with future growth and easy maintenance in mind.
4.  **Security by Design:** Implement security measures from the outset, not as an afterthought.
5.  **Clean Code & Best Practices:** Adhere to established coding standards and architectural patterns.

---

### II. Technology Stack & Usage

1.  **Frontend (React + Vite):**
    * **Component-Driven Development:** Favor small, reusable, and well-defined components.
    * **State Management:** Choose a consistent state management solution (e.g., React Context, Zustand, Jotai) and use it judiciously. Avoid prop drilling.
    * **Routing:** Utilize React Router DOM for client-side routing.
    * **Styling:** Define a consistent styling approach (e.g., Tailwind CSS, Styled Components, CSS Modules) and stick to it.
    * **Bundle Optimization:** Leverage Vite's capabilities for fast builds and optimized bundles. Lazy loading components and routes where appropriate.
    * **Accessibility (A11y):** Ensure all UI elements are accessible, following WCAG guidelines (e.g., proper ARIA attributes, keyboard navigation).
    * **Responsiveness:** Design and develop for a mobile-first approach, ensuring optimal experience across various devices.

2.  **Backend (Node.js + Express.js):**
    * **RESTful API Design:** Adhere to REST principles for API endpoints (e.g., meaningful URLs, appropriate HTTP methods, status codes).
    * **Modular Structure:** Organize the backend into logical modules (e.g., controllers, services, routes, models).
    * **Error Handling:** Implement robust, centralized error handling middleware. Provide meaningful error messages without exposing sensitive information.
    * **Input Validation:** Sanitize and validate all incoming request data (e.g., using libraries like Joi or Express-validator).
    * **Asynchronous Operations:** Use `async/await` for cleaner asynchronous code.
    * **Environment Variables:** Use environment variables for sensitive information (e.g., database credentials, JWT secrets).

3.  **Database (MongoDB):**
    * **Schema Design:** Design efficient and appropriate document schemas. Consider embedded vs. referenced documents carefully.
    * **Indexing:** Create necessary indexes to optimize query performance.
    * **Aggregation Framework:** Utilize MongoDB's aggregation framework for complex data transformations and analytics where suitable.
    * **Transactions:** Use MongoDB transactions for multi-document operations that require atomicity.

4.  **Caching (Redis Server):**
    * **Strategic Caching:** Use Redis for caching frequently accessed data (e.g., user sessions, API responses, frequently requested queries) to reduce database load and improve response times.
    * **Cache Invalidation:** Implement clear strategies for invalidating cached data when underlying data changes.
    * **Session Management:** Leverage Redis for efficient and scalable session storage.

5.  **Authentication & Authorization (JWT):**
    * **Secure Token Handling:** Store JWTs securely (e.g., HTTP-only cookies for access tokens, refresh tokens in a secure database).
    * **Token Refresh Mechanism:** Implement a robust refresh token strategy to enhance security and user experience.
    * **Middleware:** Use JWT middleware for protected routes on the backend.

6.  **Google Generative AI:**
    * **API Key Management:** Securely manage Google Generative AI API keys.
    * **Rate Limiting:** Implement client-side and server-side rate limiting for AI API calls to prevent abuse and manage costs.
    * **Responsible AI:** Ensure responsible use of AI, considering potential biases and ethical implications in generated content.
    * **Error Handling for AI Calls:** Gracefully handle errors and potential failures from the AI API.

---

### III. User Experience (UX) Enhancements

1.  **Fast Initial Load:**
    * **Code Splitting:** Implement code splitting for routes and components.
    * **Image Optimization:** Optimize images (compression, lazy loading, responsive images).
    * **Minification & Compression:** Ensure all static assets are minified and served with Gzip/Brotli compression.
    * **Critical CSS:** Inline critical CSS for above-the-fold content.

2.  **Perceived Performance:**
    * **Skeletons & Loaders:** Use skeleton screens or subtle loaders during data fetching.
    * **Optimistic UI Updates:** Implement optimistic UI updates where appropriate (e.g., a "like" button updating before the server confirms).
    * **Debouncing & Throttling:** Apply debouncing to search inputs and throttling to scroll events to prevent excessive function calls.

3.  **Intuitive Navigation & Feedback:**
    * **Clear Navigation:** Ensure clear and consistent navigation patterns.
    * **User Feedback:** Provide clear feedback for user actions (e.g., success messages, error notifications, loading states).
    * **Form Validation:** Implement real-time, helpful form validation.

4.  **Accessibility:**
    * **Keyboard Navigability:** Ensure all interactive elements are keyboard navigable.
    * **Semantic HTML:** Use semantic HTML tags for better structure and screen reader compatibility.
    * **Color Contrast:** Ensure sufficient color contrast for readability.

---

### IV. Performance Enhancements (General)

1.  **Database Query Optimization:**
    * **Avoid N+1 Queries:** Optimize database queries to avoid fetching data one row at a time in a loop.
    * **Indexing:** Use appropriate indexes on frequently queried fields.
    * **Explain Plans:** Regularly analyze query performance using `explain()` in MongoDB.

2.  **API Performance:**
    * **Payload Optimization:** Return only necessary data from API endpoints.
    * **Pagination:** Implement pagination for large datasets.
    * **Batching:** Consider batching requests for related data where appropriate.
    * **HTTP/2:** Leverage HTTP/2 for multiplexing and header compression.

3.  **Caching Strategy:**
    * **Server-Side Caching (Redis):** Cache API responses, frequently accessed data, and expensive computations.
    * **Client-Side Caching:** Utilize browser caching for static assets (e.g., `Cache-Control` headers).

4.  **Resource Management:**
    * **Connection Pooling:** Use connection pooling for database connections.
    * **Memory Management:** Monitor and optimize memory usage on the Node.js server.

---

## V. Code Quality & Development Practices
1. Version Control (Git):
    * Branching Strategy: Use a clear branching strategy (e.g., Gitflow, GitHub Flow).
    * Meaningful Commits: Write clear, concise, and descriptive commit messages.
    * Regular Rebasing/Merging: Keep branches up-to-date with main/develop.
2.  Code Style:
    * ESLint & Prettier: Use ESLint for static code analysis and Prettier for code formatting. Configure rules to enforce consistency.
    * Naming Conventions: Adhere to consistent naming conventions for variables, functions, components, and files.
3.  Testing (with Jest):

    * Comprehensive Test Coverage: Strive for high test coverage, particularly for critical logic and core functionalities.
    * Unit Tests (Jest):
        * Frontend (React Components): Write unit tests for React components using Jest and React Testing Library. Focus on testing component behavior, rendering, and user interactions.
        * Backend (Node.js/Express.js): Write unit tests for individual functions, modules, and utility helpers. Use Jest's mocking capabilities for external dependencies (e.g., database calls, API requests).
        * Generative AI Interactions: Test the functions responsible for interacting with the Google Generative AI API, mocking the actual AI responses to ensure correct handling of inputs and outputs.
        * Redis/MongoDB Interactions: Test the database interaction layers, mocking the actual database operations.
    * Integration Tests (Jest/Supertest for Backend):
        * API Endpoints: Write integration tests for your Express.js API endpoints using Jest . These tests should verify that multiple modules work correctly together, including database interactions (consider an in-memory database or dedicated test database for these).
        * Full Flow Testing: Test the integration between different backend services or microservices if applicable.
        * Test File Naming: Follow a consistent naming convention for test files (e.g., *.test.js, *.spec.js).
        * Test Descriptions: Write clear and descriptive describe and it/test blocks.
        * Clean Test Environment: Ensure tests are isolated and don't leave side effects. Use Jest's beforeEach, afterEach, beforeAll, afterAll hooks for setup and teardown.
4.  Documentation:

        * README.md: Keep the README.md file updated with setup instructions, project overview, and key commands.
        * API Documentation: Document API endpoints (e.g., using OpenAPI/Swagger).
        * Inline Comments: Use comments judiciously for complex logic or non-obvious code.
    * Code Reviews:
        * Mandatory Code Reviews: All code changes must be reviewed by at least one other team member.
        * Constructive Feedback: Provide constructive and actionable feedback during reviews.

### VI. Deployment & Operations

1.  **Containerization (Optional but Recommended):** Consider Docker for consistent development and production environments.
2.  **CI/CD:** Implement Continuous Integration/Continuous Deployment pipelines for automated testing and deployment.
3.  **Monitoring & Logging:** Set up monitoring (e.g., Prometheus, Grafana, New Relic) and centralized logging (e.g., ELK stack) to track application health and performance.
4.  **Security Audits:** Regularly review security vulnerabilities and update dependencies.

---

### VII. Communication & Collaboration

1.  **Regular Stand-ups:** Conduct daily stand-up meetings to discuss progress, blockers, and plans.
2.  **Issue Tracking:** Use an issue tracking system (e.g., Jira, Trello, GitHub Issues) to manage tasks, bugs, and features.
3.  **Clear Communication:** Maintain open and clear communication channels within the team.

