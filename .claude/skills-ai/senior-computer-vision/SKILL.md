---
name: senior-computer-vision
description: "Computer vision engineering for object detection, image segmentation, and visual AI systems. Covers YOLO, Faster R-CNN, DETR, Mask R-CNN, SAM, and production deployment with ONNX/TensorRT."
category: "ai"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Senior Computer Vision Engineer

Production computer vision engineering skill for object detection, image segmentation, and visual AI system deployment. May write or edit configuration files, training scripts, and deployment manifests.

## Quick Start

```bash
# Generate training configuration
python scripts/vision_model_trainer.py models/ --task detection --arch yolov8

# Analyze model for optimization
python scripts/inference_optimizer.py model.pt --target onnx --benchmark

# Build dataset pipeline
python scripts/dataset_pipeline_builder.py images/ --format coco --augment
```

## Core Expertise

- **Object Detection**: YOLO family (v5-v11), Faster R-CNN, DETR, RT-DETR
- **Instance Segmentation**: Mask R-CNN, YOLACT, SOLOv2
- **Semantic Segmentation**: DeepLabV3+, SegFormer, SAM (Segment Anything)
- **Image Classification**: ResNet, EfficientNet, Vision Transformers (ViT, DeiT)
- **Video Analysis**: Object tracking (ByteTrack, SORT), action recognition
- **3D Vision**: Depth estimation, point cloud processing, NeRF
- **Production Deployment**: ONNX, TensorRT, OpenVINO, CoreML

## Workflow 1: Object Detection Pipeline

1. **Define Requirements**: Target objects, real-time needs, accuracy priority, deployment target, dataset size
2. **Select Architecture**: See Architecture Selection Guide below
3. **Prepare Dataset**: Convert annotations to COCO format, verify dataset
   ```bash
   python scripts/dataset_pipeline_builder.py data/images/ --annotations data/labels/ --format coco --split 0.8 0.1 0.1
   ```
4. **Configure Training**:
   ```bash
   python scripts/vision_model_trainer.py data/coco/ --task detection --arch yolov8m --epochs 100 --batch 16
   ```
5. **Train and Validate**: Run training, validate on test set
6. **Evaluate**: Target mAP@50 >0.7, mAP@50:95 >0.5, Precision >0.8, Recall >0.8

## Workflow 2: Model Optimization and Deployment

1. **Benchmark Baseline**: `python scripts/inference_optimizer.py model.pt --benchmark --input-size 640 640`
2. **Select Optimization Path**:

| Deployment Target | Optimization Path |
|-------------------|-------------------|
| NVIDIA GPU (cloud) | PyTorch -> ONNX -> TensorRT FP16 |
| NVIDIA GPU (edge) | PyTorch -> TensorRT INT8 |
| Intel CPU | PyTorch -> ONNX -> OpenVINO |
| Apple Silicon | PyTorch -> CoreML |
| Mobile | PyTorch -> TFLite or ONNX Mobile |

3. **Export to ONNX**: `python scripts/inference_optimizer.py model.pt --export onnx --dynamic-batch --simplify`
4. **Quantize** (optional): FP16 (50% size, 1.5-2x speed, <0.5% drop) or INT8 (25% size, 2-4x speed, 1-3% drop)
5. **Convert to Target Runtime**: TensorRT, OpenVINO, or CoreML
6. **Benchmark Optimized Model**: Compare against baseline

## Workflow 3: Custom Dataset Preparation

> See references/reference-docs-and-commands.md for detailed dataset commands and format conversions.

1. **Audit Raw Data**: `python scripts/dataset_pipeline_builder.py data/raw/ --analyze`
2. **Clean and Validate**: Remove corrupted/duplicate images
3. **Convert Format**: VOC->COCO, YOLO->COCO, etc.
4. **Apply Augmentations**: Geometric, color, advanced (mosaic, mixup, cutout)
5. **Create Splits**: 80/10/10 for 1K-10K images, stratified
6. **Generate Config**: For Ultralytics or Detectron2

## Architecture Selection Guide

### Object Detection

| Architecture | Speed | Accuracy | Best For |
|--------------|-------|----------|----------|
| YOLOv8n | 1.2ms | 37.3 mAP | Edge, mobile, real-time |
| YOLOv8m | 4.2ms | 50.2 mAP | General purpose |
| YOLOv8x | 10.1ms | 53.9 mAP | Maximum accuracy |
| RT-DETR-L | 5.3ms | 53.0 mAP | Transformer, no NMS |
| Faster R-CNN R50 | 46ms | 40.2 mAP | Two-stage, high quality |

### Segmentation

| Architecture | Type | Speed | Best For |
|--------------|------|-------|----------|
| YOLOv8-seg | Instance | 4.5ms | Real-time |
| Mask R-CNN | Instance | 67ms | High-quality masks |
| SAM | Promptable | 50ms | Zero-shot |
| DeepLabV3+ | Semantic | 25ms | Scene parsing |
| SegFormer | Semantic | 15ms | Efficient semantic seg |

### CNN vs Vision Transformer

| Aspect | CNN (YOLO, R-CNN) | ViT (DETR, DINO) |
|--------|-------------------|------------------|
| Training data needed | 1K-10K images | 10K-100K+ |
| Training time | Fast | Slow |
| Inference speed | Faster | Slower |
| Global context | Limited | Excellent |

## Performance Targets

| Metric | Real-time | High Accuracy | Edge |
|--------|-----------|---------------|------|
| FPS | >30 | >10 | >15 |
| mAP@50 | >0.6 | >0.8 | >0.5 |
| Latency P99 | <50ms | <150ms | <100ms |
| Model Size | <50MB | <200MB | <20MB |

## Resources

- `references/computer_vision_architectures.md` - Architecture deep dives
- `references/object_detection_optimization.md` - Optimization guide
- `references/production_vision_systems.md` - Deployment guide
