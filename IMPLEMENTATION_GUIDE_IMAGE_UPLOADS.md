# 📸 Image Upload Implementation Guide

## 🎯 Overview
This guide provides step-by-step implementation for secure image uploads using Cloudinary, with comprehensive security measures and real-time chat integration.

---

## 🔧 Step 1: Cloudinary Setup and Configuration

### 1.1 Create Cloudinary Account
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your API credentials from the dashboard
3. Create upload presets for automated processing

### 1.2 Environment Configuration
```bash
# backend/.env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=chat_uploads
MAX_IMAGE_SIZE=5242880  # 5MB in bytes
```

### 1.3 Install Dependencies
```bash
cd backend
npm install cloudinary multer multer-storage-cloudinary sharp file-type clamscan
```

---

## 🔒 Step 2: Security Implementation

### 2.1 Create File Security Service
```javascript
// backend/services/FileSecurityService.js
const crypto = require('crypto');
const sharp = require('sharp');
const fileType = require('file-type');

class FileSecurityService {
  constructor() {
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.maxDimensions = { width: 4096, height: 4096 };
  }

  async validateFile(fileBuffer, originalName) {
    try {
      // Check file size
      if (fileBuffer.length > this.maxFileSize) {
        return { valid: false, error: 'File size exceeds 5MB limit' };
      }

      // Detect file type from buffer
      const type = await fileType.fromBuffer(fileBuffer);
      if (!type || !this.allowedTypes.includes(type.mime)) {
        return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP allowed' };
      }

      // Validate image dimensions
      const metadata = await sharp(fileBuffer).metadata();
      if (metadata.width > this.maxDimensions.width || 
          metadata.height > this.maxDimensions.height) {
        return { valid: false, error: 'Image dimensions too large (max 4096x4096)' };
      }

      // Check for embedded malicious content
      const isClean = await this.scanForMaliciousContent(fileBuffer);
      if (!isClean) {
        return { valid: false, error: 'File contains suspicious content' };
      }

      // Generate file hash for duplicate detection
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      return {
        valid: true,
        fileHash: hash,
        mimeType: type.mime,
        dimensions: { width: metadata.width, height: metadata.height }
      };
    } catch (error) {
      return { valid: false, error: 'File validation failed' };
    }
  }

  async scanForMaliciousContent(buffer) {
    // Convert buffer to string and check for suspicious patterns
    const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000));
    
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /onload=/i,
      /onclick=/i,
      /eval\(/i,
      /document\.write/i
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(content));
  }

  async optimizeImage(buffer) {
    try {
      return await sharp(buffer)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } catch (error) {
      throw new Error('Image optimization failed');
    }
  }
}

module.exports = FileSecurityService;
```

### 2.2 Rate Limiting for Uploads
```javascript
// backend/middlewares/uploadRateLimiter.js
const { RateLimiterMemory } = require('rate-limiter-flexible');

const uploadRateLimiter = new RateLimiterMemory({
  keyPrefix: 'image_uploads',
  points: 10, // 10 uploads
  duration: 60, // per 60 seconds by IP
  blockDuration: 300 // block for 5 minutes if exceeded
});

const uploadRateLimitMiddleware = async (req, res, next) => {
  try {
    await uploadRateLimiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({ 
      error: 'Too many upload attempts. Please try again in 5 minutes.' 
    });
  }
};

module.exports = uploadRateLimitMiddleware;
```

---

## ☁️ Step 3: Cloudinary Integration

### 3.1 Configure Cloudinary Storage
```javascript
// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Create storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => `chat-uploads/site-${req.body.siteId}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image',
    // Add metadata for tracking
    context: {
      siteId: (req, file) => req.body.siteId,
      sessionId: (req, file) => req.body.sessionId,
      uploadedBy: (req, file) => req.body.senderType,
      timestamp: (req, file) => new Date().toISOString()
    }
  }
});

module.exports = { cloudinary, storage };
```

### 3.2 Multer Configuration
```javascript
// backend/middlewares/upload.js
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const FileSecurityService = require('../services/FileSecurityService');

const fileSecurityService = new FileSecurityService();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024,
    files: 1,
    fields: 10
  },
  fileFilter: async (req, file, cb) => {
    try {
      // Validate file type from buffer
      if (file.buffer) {
        const validation = await fileSecurityService.validateFile(file.buffer, file.originalname);
        if (!validation.valid) {
          return cb(new Error(validation.error), false);
        }
      }
      
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  }
});

// Upload middleware with error handling
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

module.exports = { upload, handleUpload };
```

---

## 🔄 Step 4: Real-Time Chat Integration

### 4.1 Image Upload API Endpoint
```javascript
// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { handleUpload } = require('../middlewares/upload');
const uploadRateLimitMiddleware = require('../middlewares/uploadRateLimiter');
const { authenticateSocket } = require('../middlewares/auth');

// Image upload endpoint
router.post('/upload-image', 
  authenticateSocket,           // JWT authentication
  uploadRateLimitMiddleware,    // Rate limiting
  handleUpload,                 // File upload handling
  async (req, res) => {
    try {
      const { siteId, sessionId, senderType } = req.body;
      const uploadedFile = req.file;
      
      if (!uploadedFile) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Validate request data
      if (!siteId || !sessionId || !senderType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Verify sender has access to this site
      const hasAccess = await verifySiteAccess(req.user.id, siteId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Create image message data
      const imageMessage = {
        type: 'image',
        fileUrl: uploadedFile.path,
        fileName: uploadedFile.originalname,
        fileSize: uploadedFile.size,
        mimeType: uploadedFile.mimetype,
        publicId: uploadedFile.filename,
        dimensions: {
          width: uploadedFile.width,
          height: uploadedFile.height
        }
      };
      
      // Save to MongoDB
      const messageData = {
        siteId,
        sessionId,
        sender: {
          type: senderType,
          id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar
        },
        message: imageMessage,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          uploaded: true
        }
      };
      
      // Save to database
      const savedMessage = await MessageModel.create(messageData);
      
      // Emit to Socket.IO room
      const io = req.app.get('io');
      io.to(`site_${siteId}`).emit('new_message', {
        ...messageData,
        _id: savedMessage.insertedId
      });
      
      // Send response
      res.json({
        success: true,
        message: {
          id: savedMessage.insertedId,
          fileUrl: imageMessage.fileUrl,
          thumbnailUrl: uploadedFile.path.replace('/upload/', '/upload/w_300,h_300,c_fill/'),
          dimensions: imageMessage.dimensions
        }
      });
      
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

module.exports = router;
```

### 4.2 Frontend Image Upload Component
```javascript
// frontend/src/components/ChatPanel/ImageUpload.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { BsImage } from 'react-icons/bs';

const ImageUpload = ({ onImageUpload, siteId, sessionId }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload file
    await uploadFile(file);
  }, [siteId, sessionId]);

  const uploadFile = async (file) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('siteId', siteId);
    formData.append('sessionId', sessionId);
    formData.append('senderType', 'admin'); // or 'visitor'

    try {
      const response = await fetch(`${API_URL}/chat/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onImageUpload(data.message);
      toast.success('Image uploaded successfully');
      setPreview(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="image-upload">
      <div 
        {...getRootProps()} 
        className={`upload-zone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <BsImage className="upload-icon" />
        <p>{isDragActive ? 'Drop image here' : 'Click or drag image'}</p>
      </div>
      
      {preview && (
        <div className="upload-preview">
          <img src={preview} alt="Preview" className="preview-image" />
          {uploading && <div className="upload-spinner">Uploading...</div>}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
```

### 4.3 Message Component with Image Support
```javascript
// frontend/src/components/ChatPanel/Message.jsx
const Message = ({ message, isOwn }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const renderMessageContent = () => {
    if (message.type === 'image' && message.fileUrl) {
      return (
        <div className="image-message">
          {!imageLoaded && !imageError && (
            <div className="image-loading">Loading image...</div>
          )}
          {imageError && (
            <div className="image-error">Failed to load image</div>
          )}
          <img
            src={message.fileUrl}
            alt={message.fileName || 'Shared image'}
            className={`shared-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              cursor: 'pointer'
            }}
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          {message.fileName && (
            <div className="image-filename">{message.fileName}</div>
          )}
        </div>
      );
    }

    return <div className="text-message">{message.text}</div>;
  };

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {renderMessageContent()}
      </div>
      <div className="message-time">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};
```

---

## 🧪 Step 5: Testing Implementation

### 5.1 Unit Tests for File Security
```javascript
// backend/tests/fileSecurity.test.js
const FileSecurityService = require('../services/FileSecurityService');
const fs = require('fs').promises;

describe('FileSecurityService', () => {
  let service;

  beforeEach(() => {
    service = new FileSecurityService();
  });

  test('should reject oversized files', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const result = await service.validateFile(largeBuffer, 'test.jpg');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File size');
  });

  test('should reject invalid file types', async () => {
    const exeBuffer = Buffer.from('MZ'); // EXE header
    const result = await service.validateFile(exeBuffer, 'malware.exe');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });

  test('should detect malicious content', async () => {
    const maliciousBuffer = Buffer.from('<script>alert("xss")</script>');
    const result = await service.scanForMaliciousContent(maliciousBuffer);
    
    expect(result).toBe(false); // Should detect as malicious
  });

  test('should validate clean images', async () => {
    // Create a valid 1x1 PNG
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53 // Rest of header
    ]);
    
    const result = await service.validateFile(pngBuffer, 'test.png');
    
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe('image/png');
  });
});
```

### 5.2 Integration Tests for Upload Flow
```javascript
// backend/tests/imageUpload.test.js
const request = require('supertest');
const app = require('../app');
const fs = require('fs').promises;
const path = require('path');

describe('Image Upload Integration', () => {
  let authToken;
  let siteId = 'test-site-id';
  let sessionId = 'test-session-id';

  beforeEach(async () => {
    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@example.com',
        password: 'user123'
      });
    
    authToken = loginResponse.body.token;
  });

  test('should upload valid image successfully', async () => {
    // Create test image
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const response = await request(app)
      .post('/api/chat/upload-image')
      .set('Authorization', `Bearer ${authToken}`)
      .field('siteId', siteId)
      .field('sessionId', sessionId)
      .field('senderType', 'admin')
      .attach('image', testImagePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message.fileUrl).toBeDefined();
    expect(response.body.message.thumbnailUrl).toBeDefined();
  });

  test('should reject upload without authentication', async () => {
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const response = await request(app)
      .post('/api/chat/upload-image')
      .attach('image', testImagePath);

    expect(response.status).toBe(401);
  });

  test('should reject oversized files', async () => {
    // Create large test file
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const tempPath = path.join(__dirname, 'temp', 'large-image.jpg');
    await fs.writeFile(tempPath, largeBuffer);
    
    const response = await request(app)
      .post('/api/chat/upload-image')
      .set('Authorization', `Bearer ${authToken}`)
      .field('siteId', siteId)
      .field('sessionId', sessionId)
      .field('senderType', 'admin')
      .attach('image', tempPath);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('too large');
    
    // Cleanup
    await fs.unlink(tempPath);
  });
});
```

---

## 📊 Step 6: Performance Optimization

### 6.1 Image Optimization Pipeline
```javascript
// backend/services/ImageOptimizationService.js
const sharp = require('sharp');

class ImageOptimizationService {
  constructor() {
    this.thumbnailSize = { width: 300, height: 300 };
    this.previewSize = { width: 800, height: 800 };
    this.quality = 85;
  }

  async createOptimizedImages(buffer) {
    try {
      // Get original metadata
      const metadata = await sharp(buffer).metadata();
      
      // Create thumbnail
      const thumbnail = await this.createThumbnail(buffer, metadata);
      
      // Create preview (for modal/lightbox)
      const preview = await this.createPreview(buffer, metadata);
      
      // Optimize original if needed
      const optimized = await this.optimizeOriginal(buffer, metadata);
      
      return {
        original: optimized,
        thumbnail,
        preview,
        metadata: {
          original: { width: metadata.width, height: metadata.height },
          thumbnail: this.thumbnailSize,
          preview: this.getPreviewDimensions(metadata)
        }
      };
    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  async createThumbnail(buffer, metadata) {
    return sharp(buffer)
      .resize(this.thumbnailSize.width, this.thumbnailSize.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
  }

  async createPreview(buffer, metadata) {
    const dimensions = this.getPreviewDimensions(metadata);
    
    return sharp(buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: this.quality, progressive: true })
      .toBuffer();
  }

  async optimizeOriginal(buffer, metadata) {
    // Only optimize if file is large or high quality
    if (metadata.size > 2 * 1024 * 1024 || metadata.density > 150) {
      return sharp(buffer)
        .jpeg({ quality: this.quality, progressive: true })
        .toBuffer();
    }
    
    return buffer;
  }

  getPreviewDimensions(metadata) {
    const maxDimension = 1200;
    const aspectRatio = metadata.width / metadata.height;
    
    if (metadata.width > metadata.height) {
      return {
        width: Math.min(maxDimension, metadata.width),
        height: Math.round(maxDimension / aspectRatio)
      };
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: Math.min(maxDimension, metadata.height)
      };
    }
  }
}

module.exports = ImageOptimizationService;
```

### 6.2 Caching Strategy
```javascript
// backend/services/ImageCacheService.js
const redis = require('redis');
const { promisify } = require('util');

class ImageCacheService {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.setex).bind(this.client);
    
    // Cache TTL: 1 hour for metadata, 24 hours for URLs
    this.TTL_META = 3600;
    this.TTL_URL = 86400;
  }

  async getImageMetadata(imageId) {
    const key = `image:meta:${imageId}`;
    const cached = await this.getAsync(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setImageMetadata(imageId, metadata) {
    const key = `image:meta:${imageId}`;
    await this.setAsync(key, this.TTL_META, JSON.stringify(metadata));
  }

  async getSignedUrl(imageId) {
    const key = `image:url:${imageId}`;
    return await this.getAsync(key);
  }

  async setSignedUrl(imageId, url) {
    const key = `image:url:${imageId}`;
    await this.setAsync(key, this.TTL_URL, url);
  }
}

module.exports = ImageCacheService;
```

---

## 🚀 Step 7: Deployment and Monitoring

### 7.1 Environment Variables for Production
```bash
# Production environment variables
CLOUDINARY_CLOUD_NAME=your_prod_cloud_name
CLOUDINARY_API_KEY=your_prod_api_key
CLOUDINARY_API_SECRET=your_prod_api_secret
MAX_IMAGE_SIZE=5242880
UPLOAD_RATE_LIMIT=10
UPLOAD_WINDOW=60
IMAGE_CACHE_TTL=86400
REDIS_HOST=your_redis_host
REDIS_PORT=6379
```

### 7.2 Health Check Endpoint
```javascript
// backend/routes/health.js
router.get('/health/uploads', async (req, res) => {
  try {
    // Test Cloudinary connection
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.api.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cloudinary: result.status === 'ok' ? 'healthy' : 'unhealthy',
        uploads: 'healthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

### 7.3 Monitoring Metrics
```javascript
// backend/services/UploadMetricsService.js
class UploadMetricsService {
  constructor() {
    this.metrics = {
      uploadsSuccessful: 0,
      uploadsFailed: 0,
      uploadsRejected: 0,
      totalSize: 0,
      averageSize: 0
    };
  }

  recordUploadSuccess(size) {
    this.metrics.uploadsSuccessful++;
    this.metrics.totalSize += size;
    this.metrics.averageSize = this.metrics.totalSize / this.metrics.uploadsSuccessful;
  }

  recordUploadFailure(reason) {
    if (reason === 'rejected') {
      this.metrics.uploadsRejected++;
    } else {
      this.metrics.uploadsFailed++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.uploadsSuccessful / 
        (this.metrics.uploadsSuccessful + this.metrics.uploadsFailed + this.metrics.uploadsRejected)
    };
  }
}

module.exports = UploadMetricsService;
```

---

## ✅ Testing Checklist

### Pre-Deployment Testing
- [ ] Upload valid images (JPG, PNG, GIF, WebP)
- [ ] Reject invalid file types (EXE, PDF, etc.)
- [ ] Enforce file size limits
- [ ] Test rate limiting
- [ ] Validate image dimensions
- [ ] Test malicious file detection
- [ ] Verify Cloudinary integration
- [ ] Test real-time chat integration
- [ ] Validate thumbnail generation
- [ ] Test error handling

### Load Testing
- [ ] Concurrent upload testing
- [ ] Large file upload performance
- [ ] Rate limiting effectiveness
- [ ] Memory usage under load

### Security Testing
- [ ] XSS prevention in image metadata
- [ ] Malware upload prevention
- [ ] Rate limiting bypass attempts
- [ ] File type spoofing attempts

This comprehensive implementation guide provides a secure, scalable, and production-ready image upload system for the Advanced Live Chat SaaS platform.