const fs = require('fs');

let code = fs.readFileSync('firestore.rules', 'utf8');

const target = `match /users/{userId} {
      allow read, list: if isOwner(userId) || isTrainer();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isTrainer());
      allow delete: if isTrainer();`;

const replacement = `match /users/{userId} {
      allow read, list: if isOwner(userId) || isTrainer();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isTrainer() ||
        (isOwner(userId) && !request.resource.data.diff(resource.data)
          .affectedKeys().hasAny(['isTrainer', 'plan', 'gamification']));
      allow delete: if isTrainer();`;

code = code.replace(target, replacement);

fs.writeFileSync('firestore.rules', code);
