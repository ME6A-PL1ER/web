# Deployment Guide

This directory contains deployment configurations for various platforms and environments.

## Quick Start

### Local Development with Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   This starts both backend and frontend in development mode.

2. **Production build:**
   ```bash
   docker-compose --profile production up --build
   ```

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t physics-engine .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 physics-engine
   ```

### Kubernetes Deployment

1. **Apply the manifests:**
   ```bash
   kubectl apply -f deploy/kubernetes.yaml
   ```

2. **Configure ingress:**
   - Update the host in `kubernetes.yaml` to your domain
   - Ensure you have an ingress controller (like NGINX) installed
   - Configure TLS certificates

### Cloud Platforms

#### Railway.app
1. Connect your GitHub repository to Railway
2. The `railway.toml` file will automatically configure the deployment
3. Set environment variables in the Railway dashboard if needed

#### Heroku
1. Add the Heroku buildpack:
   ```bash
   heroku buildpacks:add heroku/python
   heroku buildpacks:add heroku/nodejs
   ```

2. Set the Procfile (create in root):
   ```
   web: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

#### DigitalOcean App Platform
1. Create an app spec file or use the web interface
2. Configure Python app with static site (frontend)
3. Set environment variables as needed

## Configuration

### Environment Variables

- `PYTHONPATH`: Set to `/app` (or backend directory path)
- `LOG_LEVEL`: `debug`, `info`, `warning`, `error`
- `PORT`: Port for the backend server (default: 8000)
- `VITE_API_URL`: Frontend API URL (for development)

### Resource Requirements

**Minimum:**
- 128 MB RAM
- 0.1 CPU cores
- 10 GB disk space

**Recommended:**
- 512 MB RAM
- 0.5 CPU cores
- 20 GB disk space

### Health Checks

All configurations include health checks on `/api/v1/health`:
- Initial delay: 30 seconds
- Check interval: 10 seconds
- Timeout: 5 seconds
- Failure threshold: 3 consecutive failures

## Monitoring and Logging

The application provides structured logging and can be integrated with:
- **Prometheus**: Metrics endpoint available
- **Grafana**: Dashboard templates in `/monitoring` (if created)
- **ELK Stack**: JSON log format compatible
- **Application monitoring**: Sentry, DataDog, New Relic

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Configure CORS origins appropriately
3. **Rate limiting**: Implemented in nginx configuration
4. **Input validation**: All API endpoints have input validation
5. **Security headers**: Configured in nginx

## Scaling

The application is stateless and can be horizontally scaled:
- Multiple instances can run behind a load balancer
- No database or persistent storage required
- Rate limiting should be configured per-instance or at load balancer level

## Troubleshooting

### Common Issues

1. **Build failures**: Check Python/Node.js versions
2. **Health check failures**: Verify the `/api/v1/health` endpoint
3. **Memory issues**: Increase memory limits for large simulations
4. **Network timeouts**: Adjust proxy timeouts for long-running benchmarks

### Debug Commands

```bash
# Check application logs
docker logs <container-id>

# Test health endpoint
curl http://localhost:8000/api/v1/health

# Run benchmark to test performance
curl -X POST http://localhost:8000/api/v1/benchmark/run \
  -H "Content-Type: application/json" \
  -d '{"body_counts": [1,2], "step_counts": [50], "timestep": 0.02}'
```