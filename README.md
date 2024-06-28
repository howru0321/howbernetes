# howbernetes
## Table of Contents
- [Introduction](#introduction)
- [Architecture](#architecture)
- [Usage](#usage)
  - [Deploying Containers](#deploying-containers)
  - [Managing Object](#managing-objects)
- [Limitations](#limitations)

## Introduction
This project implements a simple container orchestration system inspired by Kubernetes architecture. By developing this project, I have gained a comprehensive understanding of Kubernetes and its underlying principles. This implementation aims to provide a streamlined and accessible way to manage and orchestrate containers, demonstrating the key concepts and functionalities of Kubernetes in a simplified manner. Through this project, users can learn about container deployment, scaling, and status monitoring, all within a Kubernetes-like framework.

## Architecture

<img src="public/howbernetes Architecture.png">
This project showcases a simplified container orchestration system inspired by Kubernetes, implemented with a focus on REST-based communication and modular architecture. Below are the key features and the detailed system design:

### Key Features:

1. **REST-based Communication**:
   - All interactions within the system are facilitated through RESTful APIs, providing a simple communication method between components.

2. **Component Structure**:
   - **howbectl**: A command-line interface tool, analogous to `kubectl`, built using JavaScript’s `commander` library. It allows users to create, update, and delete pods, replicasets, and deployments.
   - **howbe-api-server**: The central management server that processes requests from `howbectl`, coordinates with other components, and manages overall system state.
   - **howbe-db-server**: Responsible for persisting system state data, including deployment configurations and container statuses, ensuring data consistency and reliability.
   - **howbelet**: Deployed on worker nodes, this component handles the actual creation, management, and deletion of containers as per instructions from the `howbe-api-server`.

3. **Unidirectional Request Flow**:
   - All communications, except those initiated by `howbectl`, are unidirectional requests managed by the `howbe-api-server`.

### Additional Details

1. **Master Node Execution**:
   - The three servers on the master node (`howbe-api-server`, `howbe-db-server`, `howbe-scheduler-server`) are executed using Docker Compose to ensure synchronized startup and operation. Data from the `howbe-db-server` is stored in a Docker volume for persistent storage.

2. **Worker Node Implementation**:
   - The `howbelet` is implemented locally on each worker node. Docker is chosen as the container engine, providing a robust environment for container management.

3. **Logical Implementation in DB**:
   - The concepts of pod, replicaset, and deployment are all logically implemented within the database, allowing for efficient state management and retrieval.


### Workflow:

1. **howbectl to howbe-api-server**:
    - Handles the submission of commands for creating, deleting, and updating pods, replicasets, and deployments.
2.  **howbe-api-server to howbe-db-server**:
    - Manages the persistence of deployment and container state information, ensuring that all updates are accurately reflected in the database.
3.  **howbe-api-server to howbe-scheduler-server**:
    - Requests current worker node status and receives responses indicating the node with the least workload, facilitating optimal resource allocation.
4.  **howbe-api-server to howbelet**:
    - Issues commands for container creation and deletion on the appropriate worker nodes.

## Usage

This section provides detailed instructions on how to use the `howbectl` command-line tool to manage your container orchestration system. The tool allows you to create, update, delete, and manage various Kubernetes objects, including pods, replicasets, and deployments.

### Deploying Containers

1. **Run a Container**
   ```sh
   howbectl run <container-name> --image <image-name>
   ```
   - Creates a pod without a YAML file. The pod name is set to the container name, and it includes a single container with the specified image.

2. **Create Objects from a YAML File**
   ```sh
   howbectl create -f <yaml-file-path>
   ```
   - Creates objects based on the provided YAML file. Supported objects include Pod, ReplicaSet, and Deployment.

   #### YAML File Format
   - **Pod**
     ```yaml
     kind: Pod
     metadata:
       name: <pod-name>
       labels:
         app: <label-key-value>
     spec:
       containers:
       - name: <container-name>
         image: <image-name>
       - name: <container-name>
         image: <image-name>
       - ...
     ```

   - **ReplicaSet**
     ```yaml
     kind: ReplicaSet
     metadata:
       name: <replicaset-name>
     spec:
       selector:
         matchLabels:
           app: <match-label-value>
       replicas: 3
       template:
         metadata:
           name: <pod-name>
           labels:
             app: <label-value>
         spec:
           containers:
           - name: <container-name>
             image: <image-name>
           - ...
     ```

   - **Deployment**
     ```yaml
     kind: Deployment
     metadata:
       name: <deployment-name>
     spec:
       selector:
         matchLabels:
           app: <match-label-name>
       replicas: 3
       template:
         metadata:
           name: <pod-name>
           labels:
             app: <label-value>
         spec:
           containers:
           - name: <container-name>
             image: <image-name>
           - ...
       strategy:
         type: <strategy-type>
     ```

### Managing Objects

1. **Delete an Object**
   ```sh
   howbectl delete <object-type> <object-name>
   ```
   - Deletes the specified object.

2. **Get Object Information**
   ```sh
   howbectl get <object-type> <object-name>
   ```
   - Retrieves information about the specified object. If the object name is omitted, it retrieves information about all objects of the specified type.

3. **Apply Changes from a YAML File**
   ```sh
   howbectl apply -f <yaml-file-path>
   ```
   - Updates deployment information. If the specified deployment does not exist, it creates a new one.

4. **Scale a ReplicaSet**
   ```sh
   howbectl scale replicaset --replicas=<replicas-value> <replicaset-name>
   ```
   - Changes the number of replicas in the specified replicaset, adding or removing pods as needed.

5. **Add Worker Node Information**
   ```sh
   howbectl worker
   ```
   - Adds information about the worker node (IP, port) to the database.

## Limitations

While this project provides a simplified implementation of Kubernetes using REST-based communication, there are several limitations compared to the real-time monitoring capabilities of Kubernetes, which uses gRPC for communication.

1. **Excessive Requests on howbe-api-server**:
   - Since all communication relies on REST APIs, the `howbe-api-server` handles a high volume of requests. This can lead to bottlenecks, especially under heavy load, as every state change and update request passes through the API server.

2. **Database Synchronization Issues**:
   - The most significant limitation is the synchronization issue with the database. The current implementation sends a request to the `howbe-db-server` for every perceived information update from the `howbe-api-server`. While this works for a single `howbectl`, it fails to maintain synchronization when multiple `howbectl` instances send concurrent requests.

3. **Lack of Direct Communication from howbelet to howbe-api-server**:
   - The absence of direct requests from `howbelet` to `howbe-api-server` means the API server is not aware of all events occurring within Docker on worker nodes. This necessitates avoiding external manipulations of the Docker environment on worker nodes and ensuring no internal issues within Docker arise. If such incidents occur, synchronization problems may arise in the logical structures (pods, replicasets, deployments) that contain container information.

### Comparison with Kubernetes (gRPC-based Communication)

- **Real-time Monitoring**:
   - Kubernetes uses gRPC for efficient, bidirectional streaming communication between its components (e.g., kubelet, kube-scheduler, and kube-apiserver). This allows for real-time state updates and monitoring, significantly reducing the latency and overhead associated with REST API calls.
   - In contrast, our REST-based approach lacks real-time capabilities, leading to potential delays and synchronization issues.

- **Consistency and Reliability**:
   - Kubernetes ensures data consistency and reliability through its robust architecture, leveraging ETCD for distributed key-value storage and gRPC for synchronized communication.
   - The current project’s reliance on REST APIs and a centralized database can lead to inconsistencies, especially under concurrent access and updates. Without a distributed coordination mechanism, ensuring data consistency is more challenging.


    