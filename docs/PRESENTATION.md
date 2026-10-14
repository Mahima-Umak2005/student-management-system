# Presentation and Viva Preparation

## A. Short explanation for your professor

> This project is a **Student Information Management System** built as a **three-tier cloud application**.
> The **presentation tier** is a React website hosted on **Netlify**. The **application tier** is a
> Node.js and Express REST API hosted on **Render**. The **data tier** is a **MongoDB Atlas** cloud database,
> accessed only by the API through Mongoose. A user can add, view, search, edit and delete student records;
> every operation goes Browser → Netlify → Render → Atlas and back. Data is validated in the browser and again on
> the server, database credentials are kept in environment variables and never reach the browser, and CORS ensures
> only my website may call the API.

## B. Two-minute presentation script

*(About 280 words — practise it once with a timer.)*

"Good morning. My project is a **Student Information Management System**, deployed as a **three-tier
web application on the cloud**.

**First, the problem.** Many colleges still keep student records in registers or spreadsheets. They are hard to
search and easy to lose. My system keeps the records in one cloud database that staff can use from any browser.

**Now the architecture.** It has three tiers. The **presentation tier** is a React website that I built with Vite
and hosted on **Netlify**. It shows the forms, the search box and the student table. The **application tier** is a
Node.js and Express API hosted on **Render**. It checks the data and applies the rules. The **data tier** is
**MongoDB Atlas**, which stores the records permanently. The browser never talks to the database directly. Only the
API does, using Mongoose.

When I click *Add student*, the browser sends the details as JSON to the Render API. The API validates them, saves
them in Atlas, and sends a response back. The page then refreshes the table and the student count.

**For security,** the database password is stored in environment variables on Render, not in the code or on GitHub.
CORS allows only my Netlify site to call the API, and Helmet adds security headers.

**Now a quick demo.** I will add a student, search for them, edit their details, and delete them. After each step
you will see the same change in MongoDB Atlas.

To summarise: three tiers, three cloud services, one working application. Thank you. I am happy to answer questions."

## C. Demonstration sequence (about 4 minutes)

**Before you start:** open `https://<your-render-url>/api/health` once so Render is awake. Have these
tabs ready: the Netlify site, Atlas *Browse Collections*, the Render dashboard, the GitHub repo.

| Step | You do | You say |
|------|--------|---------|
| 1 | Show the live site with an empty or small list | "This is the Netlify frontend. The count shows how many students the database holds." |
| 2 | Open browser dev tools → Network tab, then add a student | "This request goes to my Render URL, not localhost." |
| 3 | Show the success message and new row | "The API saved it and the page refreshed automatically." |
| 4 | Switch to Atlas, refresh | "Here is the same document in the `students` collection." |
| 5 | Add the **same ID** again | "The unique index blocks duplicates and the API returns a clear 409 error." |
| 6 | Submit with a bad email | "Validation happens in the browser and on the server." |
| 7 | Search by name, then by department | "Search works on ID, name, email and department." |
| 8 | Click **Edit**, change something, save | "This is the update operation — a PUT request." |
| 9 | Refresh Atlas | "The document was updated." |
| 10 | Click **Delete** → confirm | "Deletion asks for confirmation first." |
| 11 | Refresh Atlas | "The document is gone. That completes Create, Read, Update and Delete." |
| 12 | Show Render environment variables (names only) | "Credentials live here as environment variables, never in the code." |

## D. Likely viva questions and short answers

**Three tiers**

1. **What is a three-tier architecture?**
   It splits an application into three layers: presentation (user interface), application (logic and API) and data
   (database). Each layer has one job and can be changed or scaled independently.

2. **Which technology is in each tier here?**
   Presentation: React on Netlify. Application: Node.js and Express on Render. Data: MongoDB Atlas.

3. **Why not let the frontend talk straight to the database?**
   The database password would have to be in the browser where anyone could steal it, and there would be no place
   to validate data or apply rules. The API tier protects the database.

4. **How is this different from a two-tier application?**
   A two-tier app has the client talking directly to the database. Here an application server sits in between.

**REST API and HTTP**

5. **What is a REST API?**
   A way for programs to communicate over HTTP using URLs for resources and standard methods: GET (read),
   POST (create), PUT (update), DELETE (delete). Data is usually exchanged as JSON.

6. **Which status codes does your API use?**
   200 OK, 201 Created, 400 Bad Request (validation or invalid ID), 403 Forbidden (CORS), 404 Not Found,
   409 Conflict (duplicate), 500 Server Error, 503 Service Unavailable (database down).

7. **What is JSON?**
   A lightweight text format for data using key–value pairs, for example `{"name":"Asha"}`.

8. **What is the difference between PUT and POST?**
   POST creates a new record. PUT updates an existing record identified in the URL.

**React and Express**

9. **What is React and why use it?**
   A JavaScript library for building user interfaces from reusable components. When the data (state) changes,
   React updates only the parts of the page that need to change.

10. **What is Vite?**
    A fast build tool and development server for modern frontend projects. `npm run build` creates the optimised
    files that Netlify serves.

11. **What is Express.js?**
    A minimal web framework for Node.js. It handles routes, middleware and JSON responses.

12. **What is middleware?**
    A function that runs between the request and the response, for example Helmet (security headers), CORS,
    JSON parsing and my central error handler.

13. **What is Mongoose?**
    A library that connects Node.js to MongoDB and lets you define schemas, validation and models.

**MongoDB Atlas**

14. **What is MongoDB Atlas?**
    MongoDB's cloud-hosted database service. It runs and backs up the database so I do not have to manage a server.

15. **Why NoSQL / MongoDB for this project?**
    Student records map naturally to JSON-like documents, there is no complex relational structure, and it is
    quick to set up on a free cluster.

16. **How do you prevent duplicate student IDs?**
    A unique index on `studentId` in the Mongoose schema. If a duplicate is inserted, MongoDB raises error 11000
    and my error handler returns a friendly 409 message.

17. **What is a connection string and why is it secret?**
    It contains the address and the username and password of the database. Anyone who has it can read or change
    your data, so it lives only in environment variables.

18. **Why did you allow `0.0.0.0/0` in Atlas network access?**
    Render's free plan does not give a fixed IP address. The database is still protected by a strong password and an
    encrypted connection. In production I would use a fixed IP or a private network connection.

**Netlify and Render**

19. **What does Netlify do?**
    It hosts the built static frontend files on a global network (CDN) and rebuilds automatically when I push to GitHub.

20. **What does Render do?**
    It runs my Node.js server as a web service in the cloud, installs dependencies with `npm install`, starts it
    with `npm start`, and rebuilds when I push to GitHub.

21. **Why was the first request slow on Render?**
    On the free plan, the service sleeps when idle and takes about a minute to wake up.

**CORS and environment variables**

22. **What is CORS?**
    A browser security rule that stops a website from calling an API on a different origin unless that API allows it.
    My API allows only the Netlify origin stored in `FRONTEND_URL`.

23. **Is CORS a replacement for authentication?**
    No. It only controls which websites' browsers may call the API. Tools like Postman or curl ignore it. A real system
    also needs authentication.

24. **What are environment variables and why use them?**
    Settings stored outside the code, such as `MONGODB_URI`. They keep secrets out of GitHub and let the same code run
    locally and in production with different values.

25. **Why is `VITE_API_BASE_URL` safe but `MONGODB_URI` is not?**
    Variables starting with `VITE_` are copied into the public frontend build, so they must hold only public values such
    as the API address. The database string is used only in the backend.

**CRUD**

26. **What is CRUD and where is it in your project?**
    Create (POST), Read (GET), Update (PUT), Delete (DELETE). Each has an API endpoint, a controller function and a
    matching button or form in the React app.

27. **Why validate in both the frontend and the backend?**
    Frontend validation gives instant feedback to the user. Backend validation is the real protection because anyone can
    bypass the browser and call the API directly.

28. **What happens after you add a student?**
    The API returns 201, React shows a success message, fetches the list again, and updates the table and the count.

**Improvements (for "what would you add next?")**

29. Login and roles (JWT), pagination for large lists, server-side search, automated API tests, rate limiting, a custom
    domain and monitoring.
