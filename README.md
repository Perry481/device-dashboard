# Device Dashboard

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Development Server

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

### Docker Deployment

To run the application using Docker:

#### Prerequisites

- Docker installed on your machine
- On Windows: Windows Subsystem for Linux (WSL) 2 with Ubuntu

#### Steps

1. Open a terminal (WSL 2 on Windows)

2. Navigate to the project directory:

   ```
   cd path/to/device-dashboard
   ```

3. Build the Docker image:

   ```
   docker build -t device-dashboard .
   ```

4. Run the Docker container:

   ```
   docker run -p 3000:3000 device-dashboard
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

6. To stop the application, press `Ctrl+C` in the terminal where the container is running

#### Troubleshooting

- If port 3000 is in use, you can map to a different port:

  ```
  docker run -p 3001:3000 device-dashboard
  ```

  Then access the application at `http://localhost:3001`

- Ensure Docker is running before executing any Docker commands

- On Windows, make sure you're using WSL 2 and Docker is properly installed within your WSL 2 Ubuntu environment

## API Routes

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Additional Docker Commands

- To see running containers:

  ```
  docker ps
  ```

- To stop a running container:

  ```
  docker stop <container_id>
  ```

- To remove the Docker image:
  ```
  docker rmi device-dashboard
  ```

For more information on Docker commands, refer to the [Docker documentation](https://docs.docker.com/).
