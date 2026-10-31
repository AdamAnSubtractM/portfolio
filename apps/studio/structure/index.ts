import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Content')
        .child(
          S.list()
            .title('Site Content')
            .items([
              S.documentTypeListItem('resume').title('Resumes'),
              S.documentTypeListItem('coverLetter').title('Cover Letters'),
              S.documentTypeListItem('portfolioGallery').title('Portfolio Galleries')
            ])
        ),
      S.listItem()
        .title('Building Blocks')
        .child(
          S.list()
            .title('Building Blocks')
            .items([
              S.documentTypeListItem('portfolioPiece').title('Portfolio Pieces'),
              S.documentTypeListItem('experience').title('Experience'),
              S.documentTypeListItem('education').title('Education'),
              S.documentTypeListItem('skills').title('Skills'),
              S.documentTypeListItem('tag').title('Tags')
            ])
        ),
      S.listItem()
        .title('Identity')
        .child(
          S.list()
            .title('Identity')
            .items([
              S.documentTypeListItem('contactInfo').title('Contact Info'),
              S.documentTypeListItem('social').title('Socials'),
              S.documentTypeListItem('logo').title('Logos')
            ])
        )
    ]);
