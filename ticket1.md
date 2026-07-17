user - has many projects - between user and projects table should be one to many relation
userid private key should be refference point to foreign key in projects table so project belongs to one owner only
websitejson document should be in project because that is all edit settings done in project that is created by user

project need an ownerid for recognizing to whom project belongs
website should be stored as json for lighter interactivity with user changes and app logic
project metadata is related to users and projects for features for saving, creating and publishing projects, websitejson is only after project is made, to change as desired for users
typescript type, for example string is type declared in code itself, zod schema is layer that is validating and protecting foreign data to validize type that code expects and database schema is schema in written database tables that is stored outside typescript code
foreign key protects relation and protects uniqueness of projects
if owner is deleted, cascade rule should be applied, so all of its projects should be deleted.

schema should look something like this but later will be improved:
user - userid PK, firstName, lastName, email, timestamps, projectID FK
project - projectId, projectName, timestamps, ownerID (references to userID) FK

Overview

The initial HTTPMAKER database will contain two main entities:

User
 └── has many Projects

Project
 └── belongs to one User
 └── contains one WebsiteJSON document

The relationship between users and projects is one-to-many.

One user can own multiple projects, while each project belongs to exactly one user.

The relationship is represented by storing an ownerId foreign key in the Project table.

User
- id: primary key

Project
- ownerId: foreign key referencing User.id

The User table does not need to contain a projectId column. The database can find all projects belonging to a user by querying every project whose ownerId matches the user’s id.

Why does Project need an ownerId?

A project needs an ownerId so the application and database can determine which user owns the project.

Example:

User:
id = user_123

Project:
id = project_456
ownerId = user_123

This means project_456 belongs to user_123.

The ownerId is also required for authorization. When a user attempts to open, update or delete a project, the server should verify that the project’s ownerId matches the authenticated user’s ID.

The server should query projects using both values:

where: {
  id: projectId,
  ownerId: authenticatedUserId,
}

The application must not trust an ownerId submitted by the browser. The authenticated user ID should be determined by the server.

Why should website data initially be stored as JSON?

The complete website design should initially be stored as a JSON document because HTTPMAKER already represents a website as a structured WebsiteJSON object.

The document can contain:

Theme settings
Sections
Section order
Section content
Element styles
Element links
Animations
Design customization settings

Storing this information as JSON allows the application to save and load the complete editor document without creating a separate database table for every section, element, style and animation.

This is useful while the website-builder structure is still evolving. New frontend features can often be added to WebsiteJSON without requiring a major database redesign for every property.

JSON storage does not automatically make interaction faster or lighter. Its main benefit here is flexibility and its close match with the application’s existing data structure.

Before storing a website document, the server should validate it using the HTTPMAKER Zod schema.

Why should project metadata remain outside WebsiteJSON?

Project metadata describes the project as a database resource.

Examples include:

Project ID
Project name
Owner ID
Creation date
Last updated date
Publishing status
Published URL or slug
Archive status

WebsiteJSON describes the visual website created inside the editor.

Examples include:

Theme
Sections
Text content
Images
Styles
Animations
Links

These concerns should remain separate.

A project can exist before the user makes any custom design changes. The database still needs to know the project name, owner and timestamps even when the project contains only the default website document.

Keeping metadata outside WebsiteJSON also allows the application to list projects without loading and interpreting the complete website design.

TypeScript type, Zod schema and database schema
TypeScript type

A TypeScript type describes the shape of data during development and compilation.

Example:

type ProjectName = string;

Or:

type Project = {
  id: string;
  name: string;
};

TypeScript helps developers catch incorrect usage while writing code.

TypeScript types do not validate data while the application is running. They are removed when TypeScript is compiled into JavaScript.

Zod schema

A Zod schema validates data at runtime.

It is useful for data coming from untrusted or external sources such as:

API requests
localStorage
Imported JSON
AI-generated output
Database JSON fields

Example:

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

Zod checks whether the real value matches the structure expected by the application.

Database schema

A database schema defines how information is stored and related inside the database.

It defines:

Tables
Columns
Column types
Primary keys
Foreign keys
Unique constraints
Indexes
Relationships
Referential actions

In this project, Prisma will describe the database schema, and Prisma migrations will convert those definitions into PostgreSQL tables and constraints.

What does a foreign key protect?

A foreign key protects referential integrity.

For example:

Project.ownerId → User.id

This means PostgreSQL should not allow a project to reference a user that does not exist.

A foreign key does not automatically make projects unique.

Project uniqueness is handled by:

The project primary key
A unique constraint, when one is intentionally added

For example, Project.id uniquely identifies every project.

The ownerId foreign key can appear many times because one user can own many projects.

What happens when a user is deleted?

The initial design should use cascade deletion between users and projects.

User deleted
     ↓
All projects belonging to that user are deleted

In Prisma, the relationship can use:

onDelete: Cascade

This prevents projects from remaining in the database without an owner.

This behavior should be used deliberately because deleting a user would permanently delete all associated project records.

Initial table design
User
User
- id: primary key
- firstName: optional
- lastName: optional
- email: unique
- createdAt
- updatedAt
Project
Project
- id: primary key
- name
- website: JSON
- ownerId: foreign key referencing User.id
- createdAt
- updatedAt

The relationship is:

User.id ← Project.ownerId

The User table should not contain a projectId foreign key because one user can have many projects.

Conceptual Prisma model
model User {
  id        String    @id @default(cuid())
  firstName String?
  lastName  String?
  email     String    @unique
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Project {
  id        String   @id @default(cuid())
  name      String
  website   Json
  ownerId   String
  owner     User     @relation(
    fields: [ownerId],
    references: [id],
    onDelete: Cascade
  )
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerId])
}

In the User model, projects is a Prisma relation field. It is not a physical projectId column in the User table.

The physical relationship is stored through Project.ownerId.

Final relationship
User
┌──────────────────┐
│ id PK            │
│ firstName        │
│ lastName         │
│ email UNIQUE     │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │ 1
         │
         │ many
┌────────▼─────────┐
│ Project          │
│ id PK            │
│ name             │
│ website JSON     │
│ ownerId FK       │
│ createdAt        │
│ updatedAt        │
└──────────────────┘

This structure allows one user to own multiple projects while ensuring that every project references a valid owner.