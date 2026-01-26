import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GitService } from './git.service';
import {
  GitCommitDto,
  GitCheckoutDto,
  GitPushDto,
  GitPullDto,
  GitStashDto,
} from './dto/git.dto';

@ApiTags('git')
@Controller('api/projects/:projectId/git')
export class GitController {
  constructor(private readonly gitService: GitService) {}

  @Post('init')
  @ApiOperation({ summary: 'Initialize git repository' })
  async init(@Param('projectId') projectId: string) {
    return this.gitService.init(projectId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get git status' })
  async status(@Param('projectId') projectId: string) {
    return this.gitService.status(projectId);
  }

  @Get('log')
  @ApiOperation({ summary: 'Get commit history' })
  async log(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.gitService.log(projectId, limit);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Get all branches' })
  async branches(@Param('projectId') projectId: string) {
    return this.gitService.branches(projectId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout branch or create new' })
  async checkout(
    @Param('projectId') projectId: string,
    @Body() dto: GitCheckoutDto,
  ) {
    return this.gitService.checkout(projectId, dto);
  }

  @Get('diff')
  @ApiOperation({ summary: 'Get diff of changes' })
  async diff(
    @Param('projectId') projectId: string,
    @Query('staged') staged: boolean = false,
  ) {
    return this.gitService.diff(projectId, staged);
  }

  @Get('diff/:file')
  @ApiOperation({ summary: 'Get diff of specific file' })
  async diffFile(
    @Param('projectId') projectId: string,
    @Param('file') file: string,
  ) {
    return this.gitService.diffFile(projectId, file);
  }

  @Post('add')
  @ApiOperation({ summary: 'Stage files' })
  async add(
    @Param('projectId') projectId: string,
    @Body() body: { files: string[] },
  ) {
    return this.gitService.add(projectId, body.files);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Unstage files' })
  async reset(
    @Param('projectId') projectId: string,
    @Body() body: { files: string[] },
  ) {
    return this.gitService.reset(projectId, body.files);
  }

  @Post('commit')
  @ApiOperation({ summary: 'Create commit' })
  async commit(
    @Param('projectId') projectId: string,
    @Body() dto: GitCommitDto,
  ) {
    return this.gitService.commit(projectId, dto);
  }

  @Post('push')
  @ApiOperation({ summary: 'Push to remote' })
  async push(@Param('projectId') projectId: string, @Body() dto: GitPushDto) {
    return this.gitService.push(projectId, dto);
  }

  @Post('pull')
  @ApiOperation({ summary: 'Pull from remote' })
  async pull(@Param('projectId') projectId: string, @Body() dto: GitPullDto) {
    return this.gitService.pull(projectId, dto);
  }

  @Post('stash')
  @ApiOperation({ summary: 'Stash changes' })
  async stash(@Param('projectId') projectId: string, @Body() dto: GitStashDto) {
    return this.gitService.stash(projectId, dto);
  }

  @Post('stash/pop')
  @ApiOperation({ summary: 'Pop stash' })
  async stashPop(@Param('projectId') projectId: string) {
    return this.gitService.stashPop(projectId);
  }

  @Get('stash/list')
  @ApiOperation({ summary: 'List stashes' })
  async stashList(@Param('projectId') projectId: string) {
    return this.gitService.stashList(projectId);
  }

  @Post('discard')
  @ApiOperation({ summary: 'Discard changes in files' })
  async discard(
    @Param('projectId') projectId: string,
    @Body() body: { files: string[] },
  ) {
    return this.gitService.discard(projectId, body.files);
  }

  @Get('remotes')
  @ApiOperation({ summary: 'List remotes' })
  async remotes(@Param('projectId') projectId: string) {
    return this.gitService.remotes(projectId);
  }

  @Post('remotes')
  @ApiOperation({ summary: 'Add remote' })
  async addRemote(
    @Param('projectId') projectId: string,
    @Body() body: { name: string; url: string },
  ) {
    return this.gitService.addRemote(projectId, body.name, body.url);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge branch' })
  async merge(
    @Param('projectId') projectId: string,
    @Body() body: { branch: string },
  ) {
    return this.gitService.merge(projectId, body.branch);
  }

  @Get('blame/:file')
  @ApiOperation({ summary: 'Get file blame' })
  async blame(
    @Param('projectId') projectId: string,
    @Param('file') file: string,
  ) {
    return this.gitService.blame(projectId, file);
  }
}
