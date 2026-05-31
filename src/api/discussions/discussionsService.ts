import { sleep } from '../base';
import type { Comment } from '../../types';

export const discussionsService = {
  async fetchComments(taskId: string): Promise<Comment[]> {
    await sleep();
    const stored = localStorage.getItem(`todo_comments_${taskId}`);
    if (stored) return JSON.parse(stored);
    
    // Onboarding task default checklist nodes
    if (taskId === '1') {
      const defaultComments: Comment[] = [
        {
          id: 'subtask-1-1',
          mediaId: taskId,
          mediaType: 'movie',
          userId: 'mock-user',
          userEmail: 'user@example.com',
          userName: 'Productive Hero',
          content: 'Add Tailwind CSS v4 styling configuration 🎨',
          parentId: null,
          rating: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: 'subtask-1-2',
          mediaId: taskId,
          mediaType: 'movie',
          userId: 'mock-user',
          userEmail: 'user@example.com',
          userName: 'Productive Hero',
          content: 'Integrate Redux store state engine 🧠',
          parentId: null,
          rating: 4,
          createdAt: new Date().toISOString()
        },
        {
          id: 'subtask-1-3',
          mediaId: taskId,
          mediaType: 'movie',
          userId: 'mock-user',
          userEmail: 'user@example.com',
          userName: 'Productive Hero',
          content: 'Build isolated 3-layer UI primitives 🧱',
          parentId: null,
          rating: 3,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(`todo_comments_${taskId}`, JSON.stringify(defaultComments));
      return defaultComments;
    }
    return [];
  },

  async addComment(comment: Comment): Promise<Comment> {
    await sleep();
    const comments = await this.fetchComments(comment.mediaId);
    comments.push(comment);
    localStorage.setItem(`todo_comments_${comment.mediaId}`, JSON.stringify(comments));
    return comment;
  },

  async deleteComment(taskId: string, commentId: string): Promise<string> {
    await sleep();
    const comments = await this.fetchComments(taskId);
    const filtered = comments.filter((c) => c.id !== commentId && c.parentId !== commentId);
    localStorage.setItem(`todo_comments_${taskId}`, JSON.stringify(filtered));
    return commentId;
  },

  async updateComment(taskId: string, commentId: string, content: string, rating?: number): Promise<Comment> {
    await sleep();
    const comments = await this.fetchComments(taskId);
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.content = content;
      if (rating !== undefined) comment.rating = rating;
      localStorage.setItem(`todo_comments_${taskId}`, JSON.stringify(comments));
      return comment;
    }
    throw new Error('Task element not found.');
  }
};
