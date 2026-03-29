const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

const search = `    match /community/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.authorId == request.auth.uid ||
        isTrainer() ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes'])
      );
      allow delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isTrainer());
    }`;

const replace = `    match /community/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.authorId == request.auth.uid ||
        isTrainer() ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'comments'])
      );
      allow delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isTrainer());

      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
        allow delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isTrainer());
      }
    }`;

content = content.replace(search, replace);
fs.writeFileSync('firestore.rules', content);
