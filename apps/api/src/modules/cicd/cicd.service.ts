import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GenerateCicdDto } from './dto/cicd.dto';

@Injectable()
export class CicdService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');

  private async getProjectPath(projectId: string): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);
    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  async generate(projectId: string, dto: GenerateCicdDto): Promise<{ files: string[] }> {
    const files: string[] = [];

    switch (dto.provider) {
      case 'github':
        const ghResult = await this.generateGithubActions(projectId, dto);
        files.push(...ghResult.files);
        break;
      case 'gitlab':
        const glResult = await this.generateGitlabCi(projectId, dto);
        files.push(...glResult.files);
        break;
      case 'jenkins':
        const jResult = await this.generateJenkins(projectId, dto);
        files.push(...jResult.files);
        break;
    }

    return { files };
  }

  async getStatus(projectId: string): Promise<{
    github: boolean;
    gitlab: boolean;
    jenkins: boolean;
  }> {
    const projectPath = await this.getProjectPath(projectId);

    const checkFile = async (file: string): Promise<boolean> => {
      try {
        await fs.access(path.join(projectPath, file));
        return true;
      } catch {
        return false;
      }
    };

    return {
      github: await checkFile('.github/workflows/ci.yml'),
      gitlab: await checkFile('.gitlab-ci.yml'),
      jenkins: await checkFile('Jenkinsfile'),
    };
  }

  getTemplates(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'github', name: 'GitHub Actions', description: 'CI/CD with GitHub Actions' },
      { id: 'gitlab', name: 'GitLab CI', description: 'CI/CD with GitLab CI/CD' },
      { id: 'jenkins', name: 'Jenkins', description: 'CI/CD with Jenkins Pipeline' },
    ];
  }

  async generateGithubActions(
    projectId: string,
    options: { deploy?: string; docker?: boolean } = {},
  ): Promise<{ files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);
    const workflowDir = path.join(projectPath, '.github', 'workflows');
    await fs.mkdir(workflowDir, { recursive: true });

    const workflow = `name: CI/CD

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  ${options.docker ? `
  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ secrets.DOCKER_USERNAME }}/${projectId}:latest
` : ''}
  ${options.deploy === 'vercel' ? `
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
` : ''}
  ${options.deploy === 'railway' ? `
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: \${{ secrets.RAILWAY_TOKEN }}
          service: ${projectId}
` : ''}
`;

    await fs.writeFile(path.join(workflowDir, 'ci.yml'), workflow);

    return { files: ['.github/workflows/ci.yml'] };
  }

  async generateGitlabCi(
    projectId: string,
    options: { deploy?: string; docker?: boolean } = {},
  ): Promise<{ files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);

    const config = `stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
    - npm test
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  only:
    - main
    - master

${options.docker ? `
docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
` : ''}
${options.deploy ? `
deploy:
  stage: deploy
  script:
    - echo "Deploying to ${options.deploy}..."
  only:
    - main
  when: manual
` : ''}
`;

    await fs.writeFile(path.join(projectPath, '.gitlab-ci.yml'), config);

    return { files: ['.gitlab-ci.yml'] };
  }

  async generateJenkins(
    projectId: string,
    options: { deploy?: string; docker?: boolean } = {},
  ): Promise<{ files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);

    const jenkinsfile = `pipeline {
    agent any

    tools {
        nodejs 'NodeJS 20'
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'coverage/junit.xml'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        ${options.docker ? `
        stage('Docker Build') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.build("${projectId}:\${env.BUILD_NUMBER}")
                }
            }
        }
        ` : ''}

        ${options.deploy ? `
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to ${options.deploy}...'
            }
        }
        ` : ''}
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
`;

    await fs.writeFile(path.join(projectPath, 'Jenkinsfile'), jenkinsfile);

    return { files: ['Jenkinsfile'] };
  }
}
