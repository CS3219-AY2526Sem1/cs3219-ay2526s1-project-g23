[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)

# CS3219 Project (PeerPrep) - AY2526S1

## Group: G23

> Note: All setup sections assumes you start from the root directory (i.e. `cs3219-ay2526s1-project-g23`).

### Setup MongoDB Atlas Cluster

Follow the setup guide [here](https://github.com/CS3219-AY2526Sem1/PeerPrep-UserService/blob/master/user-service/MongoDBSetup.md) to create a MongoDB Atlas Cluster.

### Setup PeerPrep (Frontend) Locally

1. Install the dependencies.

   ```
   cd peerprep
   npm install
   ```

2. Run the frontend client.

   ```
   npm run dev
   ```

3. Access PeerPrep at `http://localhost:5173`.

### Setup + Run User Service Locally

1. Setup MongoDB Atlas Cluster (if you have not).

2. Install the dependencies.

   ```
   cd user-service
   npm install
   ```

3. Create the `.env` file.

   ```
   cp .env.sample .env
   ```

4. Configure the environment variables.

   ```
   MONGO_URI_USER=mongodb+srv://<username>:<password>@<cluster-url>/user-service?retryWrites=true&w=majority&appName=<appName>
   PORT=3001
   JWT_SECRET=<your_jwt_secret_here>
   ```

5. Run the user service backend.

   ```
   npm run dev
   ```

### Setup + Run Question Service Locally

1. Setup MongoDB Atlas Cluster (if you have not).

2. Install the dependencies.

   ```
   cd question-service
   npm install
   ```

3. Create the `.env` file.

   ```
   cp .env.sample .env
   ```

4. Configure the environment variables.

   ```
   MONGO_URI_QUESTION=mongodb+srv://<username>:<password>@<cluster-url>/question-service?retryWrites=true&w=majority&appName=<appName>
   PORT=3002
   USER_SERVICE_URL=http://localhost:3001
   ```

5. Run the question service backend.

   ```
   npm run dev
   ```

### Setup + Run Matching Service Locally

1. Setup MongoDB Atlas Cluster (if you have not).

2. Setup Redis following this guide [here](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/).

3. Install the dependencies.

   ```
   cd matching-service
   npm install
   ```

4. Create the `.env` file.

   ```
   cp .env.sample .env
   ```

5. Configure the environment variables.

   ```
   PORT=3003
   NODE_ENV=development
   MONGO_URI_MATCHING="mongodb+srv://<username>:<password>@<cluster-url>/matching-service?retryWrites=true&w=majority&appName=<appName>"

   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=<password>

   FRONTEND_URL=http://localhost:5173
   USER_SERVICE_URL=http://localhost:3001
   QUESTION_SERVICE_URL=http://localhost:3002
   ```

6. Run the matching service backend.

   ```
   npm run dev
   ```

### Setup + Run Collaboration Service Locally

1. Install the dependencies.

   ```
   cd collaboration-service
   npm install
   ```

2. Create the `.env` file.

   ```
   cp .env.sample .env
   ```

3. Configure the environment variables.

   ```
   PORT=3004
   QUESTION_SERVICE_URL=http://localhost:3002
   MATCHING_SERVICE_URL=http://localhost:3003
   ```

4. Run the question service backend.

   ```
   npm run dev
   ```
