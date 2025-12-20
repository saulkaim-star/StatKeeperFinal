import { Post } from '@/types';
import Link from 'next/link';
import { FaHeart, FaImages, FaPlay, FaUserCircle } from 'react-icons/fa';

interface RecentPostsProps {
    posts: Post[];
    leagueId?: string; // Optional if we link to a dedicated feed page
    title?: string;
    viewAllLink?: string;
}

export default function RecentPosts({ posts, leagueId, title = "Recent Highlights", viewAllLink }: RecentPostsProps) {
    if (!posts || posts.length === 0) {
        return null; // Don't show anything if empty
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden mb-8 border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaImages className="text-emerald-400" />
                    {title}
                </h2>
                {viewAllLink && (
                    <Link
                        href={viewAllLink}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                        View All
                    </Link>
                )}
            </div>

            <div className="p-4 overflow-x-auto pb-6 custom-scrollbar">
                <div className="flex gap-4 min-w-min">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="relative group flex-shrink-0 w-48 h-64 rounded-xl overflow-hidden shadow-lg border border-slate-600 bg-slate-900 cursor-pointer"
                        >
                            {/* Media Content */}
                            {post.type === 'photo' ? (
                                <img
                                    src={post.mediaUrl}
                                    alt={post.caption || 'Post image'}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="relative w-full h-full">
                                    <video
                                        src={post.mediaUrl}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <FaPlay className="text-white/50 text-3xl drop-shadow-lg" />
                                    </div>
                                </div>
                            )}

                            {/* Top Gradient & User Info */}
                            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10">
                                <div className="flex items-center gap-2">
                                    {(post.userPhotoUrl || post.photoURL || post.profilePicture) ? (
                                        <div className="w-6 h-6 relative rounded-full overflow-hidden border border-white/50 shadow-sm bg-slate-700">
                                            <img
                                                src={post.userPhotoUrl || post.photoURL || post.profilePicture}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <FaUserCircle className="text-slate-300 text-xl" />
                                    )}
                                    <span className="text-white text-xs font-semibold truncate shadow-black drop-shadow-md max-w-[100px]">
                                        {post.userName || post.playerName || post.name || 'User'}
                                    </span>
                                </div>
                            </div>

                            {/* Bottom Gradient & Details */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                <h3 className="text-white font-bold text-xs leading-tight drop-shadow-md line-clamp-2 mb-1">
                                    {post.caption ? (post.caption.length > 30 ? `${post.caption.substring(0, 30)}...` : post.caption) : ''}
                                </h3>
                                <div className="flex items-center justify-between text-slate-300 text-[10px]">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-1">
                                        <FaHeart className="text-red-500 drop-shadow-sm" />
                                        <span>{post.likes ? post.likes.length : 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
