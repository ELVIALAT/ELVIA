// Schemas Zod del módulo jobs.
const { z } = require('zod');

const fetchUrl = z.object({
  url: z.string().url('URL inválida').max(2000),
});

const compatibility = z.object({
  cvText: z.string().min(1).max(50000),
  jobTitle: z.string().trim().min(1).max(300),
  jobCompany: z.string().trim().max(300).optional(),
  jobSnippet: z.string().max(10000).optional(),
  jobLink: z.string().url().max(2000).optional().or(z.literal('')),
  jobLocation: z.string().trim().max(300).optional(),
  jobVia: z.string().trim().max(120).optional(),
});

module.exports = { fetchUrl, compatibility };
