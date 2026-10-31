import { contactInfoType } from './documents/contact-info';
import { coverLetterType } from './documents/cover-letter';
import { educationType } from './documents/education';
import { experienceType } from './documents/experience';
import { logoType } from './documents/logo';
import { portfolioGalleryType } from './documents/portfolio-gallery';
import { portfolioPieceType } from './documents/portfolio-piece';
import { resumeType } from './documents/resume';
import { skillsType } from './documents/skills';
import { socialType } from './documents/socials';
import { tagType } from './documents/tag';
import { portfolioSectionType } from './objects/portfolio-section';

export const schemaTypes = [
  // Documents
  coverLetterType,
  resumeType,
  logoType,
  contactInfoType,
  experienceType,
  educationType,
  skillsType,
  socialType,
  portfolioGalleryType,
  portfolioPieceType,
  tagType,
  // Objects
  portfolioSectionType
];
