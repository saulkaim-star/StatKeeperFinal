"use client";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaComment, FaHeart, FaPaperPlane, FaRegHeart, FaTimes } from 'react-icons/fa';

interface Comment {
    id: string;
    text: string;
    userName: string;
    createdAt: any;
    userId: string;
}

interface MediaPost {
    id: string;
    mediaUrl: string;
    caption?: string;
    type: 'photo' | 'video';
    createdAt: any;
    likes?: string[];
    userName?: string;
    userPhoto?: string;
    userId?: string;
    teamId?: string; // Important for linking back to team
    playerId?: string;
}

export default function LeagueGalleryClient({ leagueId }: { leagueId: string }) {
    const [posts, setPosts] = useState<MediaPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<MediaPost | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfiles, setUserProfiles] = useState<{ [key: string]: { name: string, photo: string | null } }>({});
    const [teamProfiles, setTeamProfiles] = useState<{ [key: string]: { name: string, photo: string | null, managerIds: string[] } }>({});
    const [playerProfiles, setPlayerProfiles] = useState<{ [key: string]: { name: string, photo: string | null } }>({});

    // Comment State
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [guestName, setGuestName] = useState("");

    // Auth Init
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                signInAnonymously(auth).catch(console.error);
            }
        });
        return () => unsub();
    }, []);

    // Fetch Posts (By Competition ID)
    useEffect(() => {
        if (!leagueId) return;

        const q = query(
            collection(db, "mediaPosts"),
            where("competitionId", "==", leagueId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: MediaPost[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedPosts.push({
                    id: doc.id,
                    mediaUrl: data.mediaUrl,
                    caption: data.caption,
                    type: data.type || 'photo',
                    createdAt: data.createdAt,
                    likes: data.likes || [],
                    userName: data.userName,
                    userPhoto: data.userPhoto || data.userPhotoUrl,
                    userId: data.userId,
                    teamId: data.teamId,
                    playerId: data.playerId
                });
            });

            fetchedPosts.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            setPosts(fetchedPosts);
            setLoading(false);

            if (selectedPost) {
                const updatedSelected = fetchedPosts.find(p => p.id === selectedPost.id);
                if (updatedSelected) setSelectedPost(updatedSelected);
            }
        });

        return () => unsubscribe();
    }, [leagueId]);

    // Deep Linking
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const postId = searchParams.get('postId');
        if (postId && posts.length > 0 && !selectedPost) {
            const foundPost = posts.find(p => p.id === postId);
            if (foundPost) setSelectedPost(foundPost);
        }
    }, [searchParams, posts, selectedPost]);

    const handleClose = () => {
        setSelectedPost(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('postId');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Fetch Missing Profiles (User, Team, Player)
    useEffect(() => {
        if (posts.length === 0) return;

        const fetchMissingData = async () => {
            // 1. Users
            const uniqueUserIds = Array.from(new Set(posts.map(p => p.userId).filter(Boolean))) as string[];
            const missingUserIds = uniqueUserIds.filter(uid => !userProfiles[uid!]);

            if (missingUserIds.length > 0) {
                const newProfiles: { [key: string]: { name: string, photo: string | null } } = {};
                await Promise.all(missingUserIds.map(async (uid) => {
                    if (!uid) return;
                    try {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            newProfiles[uid] = {
                                name: data.displayName || data.name || 'User',
                                photo: data.photoURL || data.profilePicture || null
                            };
                        }
                    } catch (e) {
                        console.error("Error fetching user profile", uid, e);
                    }
                }));

                if (Object.keys(newProfiles).length > 0) {
                    setUserProfiles(prev => ({ ...prev, ...newProfiles }));
                }
            }

            // 2. Teams
            const uniqueTeamIds = Array.from(new Set(posts.map(p => p.teamId).filter(Boolean))) as string[];
            const missingTeamIds = uniqueTeamIds.filter(tid => !teamProfiles[tid!]);

            if (missingTeamIds.length > 0) {
                const newTeams: { [key: string]: { name: string, photo: string | null, managerIds: string[] } } = {};
                await Promise.all(missingTeamIds.map(async (tid) => {
                    if (!tid) return;
                    try {
                        const teamDoc = await getDoc(doc(db, 'teams', tid));
                        if (teamDoc.exists()) {
                            const data = teamDoc.data();
                            // Capture manager IDs to detect if uploader is a manager
                            const mgrIds = [data.managerId, data.ownerId, data.userId].filter(Boolean);
                            newTeams[tid] = {
                                name: data.name || data.teamName || 'Team',
                                photo: data.logoURL || data.logoUrl || data.photoURL || null,
                                managerIds: mgrIds
                            };
                        }
                    } catch (e) {
                        console.error("Error fetching team profile", tid, e);
                    }
                }));

                if (Object.keys(newTeams).length > 0) {
                    setTeamProfiles(prev => ({ ...prev, ...newTeams }));
                }
            }

            // 3. Players (Roster) - Search by ID or UserID
            const postsToCheck = posts.filter(p => p.teamId && (p.playerId || p.userId));
            // We want to avoid re-fetching if we already found the profile (keyed by userId for this fallback mechanism?)
            // Actually let's key playerProfiles by "teamId_userId" or "playerId" to be safe. 
            // Simpler: Just try to resolve any post author that is "unknown" so far.

            // Group by teamId to batch fetches if possible, but Firestore queries are specific.
            // Let's iterate unique (teamId, userId) and (teamId, playerId) tuples.

            const queriesToRun: { teamId: string, userId?: string, playerId?: string }[] = [];

            postsToCheck.forEach(p => {
                const alreadyHasProfile = (p.playerId && playerProfiles[p.playerId]) || (p.userId && playerProfiles[p.userId]); // We can key by userId too if we find them
                // Note: we are currently keying playerProfiles by playerId. If we find them by userId, we should key by userId too?
                // Let's key by `userId` in `playerProfiles` as well if found via userId query.

                if (!alreadyHasProfile) {
                    // Check if we already queued this
                    const isQueued = queriesToRun.some(q => q.teamId === p.teamId && ((p.playerId && q.playerId === p.playerId) || (p.userId && q.userId === p.userId)));
                    if (!isQueued) {
                        queriesToRun.push({ teamId: p.teamId!, userId: p.userId, playerId: p.playerId });
                    }
                }
            });

            if (queriesToRun.length > 0) {
                const newPlayers: { [key: string]: { name: string, photo: string | null } } = {};

                await Promise.all(queriesToRun.map(async ({ teamId, userId, playerId }) => {
                    try {
                        // A. If we have explicit PlayerID, get that doc
                        if (playerId) {
                            const pDoc = await getDoc(doc(db, 'teams', teamId, 'roster', playerId));
                            if (pDoc.exists()) {
                                const d = pDoc.data();
                                newPlayers[playerId] = { name: d.playerName || d.name, photo: d.photoURL || d.photoUrl };
                                if (userId) newPlayers[userId] = newPlayers[playerId]; // Map userId to this profile too
                                return;
                            }
                        }

                        // B. If not found or no PlayerID, search by UserID
                        if (userId) {
                            const qRost = query(collection(db, 'teams', teamId, 'roster'), where('userId', '==', userId));
                            const snap = await getDocs(qRost);
                            if (!snap.empty) {
                                const d = snap.docs[0].data();
                                newPlayers[userId] = { name: d.playerName || d.name, photo: d.photoURL || d.photoUrl };
                                return;
                            }

                            // Try 'uid' field just in case
                            const qRost2 = query(collection(db, 'teams', teamId, 'roster'), where('uid', '==', userId));
                            const snap2 = await getDocs(qRost2);
                            if (!snap2.empty) {
                                const d = snap2.docs[0].data();
                                newPlayers[userId] = { name: d.playerName || d.name, photo: d.photoURL || d.photoUrl };
                            }
                        }
                    } catch (e) {
                        console.error("Error resolving player", teamId, userId, e);
                    }
                }));

                if (Object.keys(newPlayers).length > 0) {
                    setPlayerProfiles(prev => ({ ...prev, ...newPlayers }));
                }
            }
        };

        fetchMissingData();
    }, [posts]);

    // Fetch Comments
    useEffect(() => {
        if (!selectedPost) {
            setComments([]);
            return;
        }
        const q = query(collection(db, "mediaPosts", selectedPost.id, "comments"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
        });
        return () => unsubscribe();
    }, [selectedPost?.id]);

    // Key Nav
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPost) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setSelectedPost(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPost, posts]);

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedPost) return;
        const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
        if (currentIndex < posts.length - 1) setSelectedPost(posts[currentIndex + 1]);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedPost) return;
        const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
        if (currentIndex > 0) setSelectedPost(posts[currentIndex - 1]);
    };

    const handleLike = async (post: MediaPost, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!currentUser) return;
        const postRef = doc(db, 'mediaPosts', post.id);
        const isLiked = post.likes?.includes(currentUser.uid);
        try {
            if (isLiked) {
                await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
            }
        } catch (error) { console.error("Error liking post:", error); }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !selectedPost || !currentUser) return;
        const nameToUse = guestName.trim() || currentUser.displayName || "Fan";
        try {
            await addDoc(collection(db, "mediaPosts", selectedPost.id, "comments"), {
                text: newComment.trim(),
                userId: currentUser.uid,
                userName: nameToUse,
                createdAt: serverTimestamp()
            });
            setNewComment("");
        } catch (error) { console.error("Error adding comment:", error); }
    };

    const formatCommentDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Helper to get Author Info
    const getAuthorInfo = (post: MediaPost) => {
        const teamInfo = post.teamId ? teamProfiles[post.teamId] : null;

        // 0. CHECK SPECIFIC PLAYER PROFILE (Highest Priority for players)
        if (post.playerId && playerProfiles[post.playerId]) {
            const pp = playerProfiles[post.playerId];
            return { name: pp.name, photo: pp.photo, isTeam: false };
        }

        // 0.b CHECK ROSTER PROFILE BY USER ID (If we found them in the roster via userId)
        if (post.userId && playerProfiles[post.userId]) {
            const pp = playerProfiles[post.userId];
            return { name: pp.name, photo: pp.photo, isTeam: false };
        }

        // 1. If Uploader is The Manager/Owner of the linked team, show Team
        if (post.userId && teamInfo) {
            if (teamInfo.managerIds && teamInfo.managerIds.includes(post.userId)) {
                return { name: teamInfo.name, photo: teamInfo.photo, isTeam: true };
            }
        }

        // 2. Otherwise, prefer Specific User Profile (Player/Fan)
        if (post.userId && userProfiles[post.userId]) {
            const up = userProfiles[post.userId];
            return { name: up.name, photo: up.photo, isTeam: false };
        }

        // 3. Fallback to Team if User Profile missing but we know the team
        if (teamInfo) {
            return { name: teamInfo.name, photo: teamInfo.photo, isTeam: true };
        }

        // 4. Last Fallback to Post Data (Legacy)
        if (post.userName && post.userName !== 'User') {
            return { name: post.userName, photo: post.userPhoto, isTeam: false };
        }

        return { name: "Abierto", photo: null, isTeam: false };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const currentIndex = selectedPost ? posts.findIndex(p => p.id === selectedPost.id) : -1;
    const hasNext = currentIndex < posts.length - 1;
    const hasPrev = currentIndex > 0;

    return (
        <div>
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {posts.map((post) => {
                    const author = getAuthorInfo(post);
                    return (
                        <div
                            key={post.id}
                            className="group bg-slate-900 rounded-3xl p-3 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300 flex flex-col"
                        >
                            <div
                                className="relative aspect-[4/5] w-full rounded-xl overflow-hidden cursor-pointer bg-slate-900"
                                onClick={() => setSelectedPost(post)}
                            >
                                {post.type === 'video' ? (
                                    <video src={post.mediaUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <Image
                                        src={post.mediaUrl}
                                        alt="Post"
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />
                                )}
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => handleLike(post, e)}
                                        className="bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-all shadow-lg"
                                    >
                                        {currentUser && post.likes?.includes(currentUser.uid) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-3 px-1 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 max-w-[70%]">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 overflow-hidden relative flex-shrink-0">
                                        {author.photo ? <Image src={author.photo} alt="User" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold bg-slate-700">{author.isTeam ? "TM" : author.name.substring(0, 2).toUpperCase()}</div>}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-slate-200 leading-none truncate w-full">{author.name}</span>
                                        <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-700/30 px-2 py-1 rounded-full flex-shrink-0">
                                    <FaHeart className="text-xs text-slate-400" />
                                    <span className="text-xs font-bold text-slate-300">{post.likes?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {selectedPost && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-200"
                    onClick={handleClose}
                >
                    <div
                        className="bg-black md:bg-slate-900 w-full md:w-[90%] lg:w-[80%] max-w-6xl h-full md:h-[80vh] md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl border-0 md:border border-slate-700 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={handleClose} className="absolute top-4 right-4 z-[60] text-white/80 hover:text-white p-2 md:hidden"><FaTimes size={24} /></button>
                        <button onClick={handleClose} className="absolute top-4 right-4 z-[60] text-slate-400 hover:text-white hidden md:block"><FaTimes size={20} /></button>

                        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0 group select-none">
                            {hasPrev && <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-all z-20 opacity-0 group-hover:opacity-100"><FaChevronLeft size={20} /></button>}
                            {hasNext && <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-all z-20 opacity-0 group-hover:opacity-100"><FaChevronRight size={20} /></button>}
                            {selectedPost.type === 'video' ? <video src={selectedPost.mediaUrl} controls className="max-w-full max-h-full object-contain" /> : <div className="relative w-full h-full"><Image src={selectedPost.mediaUrl} alt="Detail" fill className="object-contain" /></div>}
                        </div>

                        <div className="w-full md:w-[400px] flex flex-col bg-slate-900 h-[60vh] md:h-full border-l border-slate-700">
                            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const author = getAuthorInfo(selectedPost);
                                        return (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 overflow-hidden relative flex-shrink-0">
                                                    {author.photo ? <Image src={author.photo} alt="User" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold bg-slate-700">{author.isTeam ? "TM" : author.name.substring(0, 2).toUpperCase()}</div>}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-sm">{author.name}</span>
                                                    <span className="text-[10px] text-slate-400">Original Poster</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedPost.caption && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden relative flex-shrink-0">
                                            {(() => { const a = getAuthorInfo(selectedPost); return a.photo ? <Image src={a.photo} alt="User" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white">TM</div> })()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-300"><span className="font-bold text-white mr-2">{getAuthorInfo(selectedPost).name}</span>{selectedPost.caption}</p>
                                            <span className="text-[10px] text-slate-500 mt-1 block">{selectedPost.createdAt ? new Date(selectedPost.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                )}
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs text-white uppercase font-bold">{comment.userName.substring(0, 2)}</div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-300"><span className="font-bold text-white mr-2">{comment.userName}</span>{comment.text}</p>
                                            <span className="text-[10px] text-slate-500 mt-1 block">{formatCommentDate(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-700 bg-slate-900">
                                <div className="flex items-center gap-4 mb-4">
                                    <button onClick={(e) => handleLike(selectedPost, e)} className="text-2xl transition-transform active:scale-95 outline-none focus:outline-none">
                                        {currentUser && selectedPost.likes?.includes(currentUser.uid) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-white hover:text-slate-300" />}
                                    </button>
                                    <FaComment className="text-xl text-white hover:text-slate-300" />
                                    <FaPaperPlane className="text-xl text-white hover:text-slate-300 -rotate-12" />
                                </div>
                                <div className="font-bold text-white text-sm mb-2">{selectedPost.likes?.length || 0} likes</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-4">{selectedPost.createdAt ? new Date(selectedPost.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : ''}</div>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        {!guestName && !currentUser?.displayName && (
                                            <input type="text" placeholder="Your Name" className="w-full bg-slate-800 border-none rounded-t-lg px-3 py-1 text-xs text-white focus:ring-0 mb-[1px]" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                                        )}
                                        <input type="text" placeholder="Write a comment..." className={`w-full bg-slate-800 border-none px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 ${!guestName && !currentUser?.displayName ? 'rounded-b-lg' : 'rounded-lg'}`} value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} />
                                    </div>
                                    <button className="text-blue-400 font-bold text-sm disabled:opacity-50 hover:text-white" disabled={!newComment.trim()} onClick={handleSendComment}>Post</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
