import { defineCollection } from 'astro:content';
import resumeConfig from '../resume.config';
import { Resume } from './core/schema';
import { resumeLoader } from './loaders/resume';

export const collections = {
  resume: defineCollection({
    loader: resumeLoader(resumeConfig, process.env),
    schema: Resume,
  }),
};
