import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const CommunitySection = ({ user }: { user: any }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user) return;

    try {
      await addDoc(collection(db, 'community'), {
        authorId: user.uid,
        displayName: user.displayName || 'Anonymous',
        content: newPostContent,
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Post to Community</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share an update or achievement..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newPostContent.trim()}
            className="self-end px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Post
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                {post.displayName?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <p className="font-bold text-gray-900">{post.displayName}</p>
                <p className="text-xs text-gray-500">
                  {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunitySection;
