import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Input, Label } from '../components/ui';
import useUserStore from '../store/userStore';
import { Upload, FileText, ShoppingCart, BarChart, Users } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useUserStore();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Live Stats State
    const [stats, setStats] = useState({
        totalArticles: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalUsers: 0
    });

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [file, setFile] = useState(null);
    const [authorName, setAuthorName] = useState(''); // Changed to text input
    // const [authorId, setAuthorId] = useState(''); // Deprecated
    const [editingId, setEditingId] = useState(null); // Track edit mode
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Articles
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });

            if (articlesError) throw articlesError;
            setArticles(articlesData);

            // 2. Fetch Purchases (Sales & Revenue)
            const { data: purchasesData, error: purchasesError } = await supabase
                .from('purchases')
                .select('amount_paid');

            if (purchasesError) throw purchasesError;

            const totalSales = purchasesData.length;
            const totalRevenue = purchasesData.reduce((sum, item) => sum + (Number(item.amount_paid) || 0), 0);

            // 3. Fetch Users for Stats AND Dropdown
            // Note: In real app with thousands of users, you'd want search/pagination.
            const { data: profilesData, error: usersError } = await supabase
                .from('profiles')
                .select('*');

            if (usersError) throw usersError;

            setUsersList(profilesData);
            setStats({
                totalArticles: articlesData.length,
                totalSales,
                totalRevenue,
                totalUsers: profilesData.length || 0
            });

            // Default author to current admin
            if (user && !authorId) setAuthorId(user.id);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        // Allow update if authorName is present (we might need to refine validation)
        if (!title || !price) return;

        setUploading(true);
        try {
            let filePath = null;

            // 1. Upload File if selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('articles')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;
            }

            // 2. Insert or Update Record
            const articleData = {
                title,
                description,
                price: parseFloat(price),
                author_name: authorName,
                // Only update file_path if a new file was uploaded
                ...(filePath && { file_path: filePath }),
                // Only set author_id if creating new, or if explicitly changing link? 
                // For simplicity, we keep original author_id or set to admin on create
                ...(editingId ? {} : { author_id: user.id }),
                is_public: true
            };

            let error;
            if (editingId) {
                // Update
                const { error: updateError } = await supabase
                    .from('articles')
                    .update(articleData)
                    .eq('id', editingId);
                error = updateError;
            } else {
                // Insert
                if (!file) throw new Error("File is required for new articles");
                const { error: insertError } = await supabase
                    .from('articles')
                    .insert([articleData]);
                error = insertError;
            }

            if (error) throw error;

            // Reset form
            setTitle('');
            setDescription('');
            setPrice('');
            setAuthorName('');
            setFile(null);
            setEditingId(null);

            fetchDashboardData();
            alert(editingId ? 'Article updated!' : 'Article uploaded!');

        } catch (error) {
            console.error('Error saving:', error);
            alert('Operation failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this article?")) return;

        try {
            const { error } = await supabase.from('articles').delete().eq('id', id);
            if (error) throw error;
            fetchDashboardData();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete article");
        }
    };

    const handleEditClick = (article) => {
        setEditingId(article.id);
        setTitle(article.title);
        setDescription(article.description || '');
        setPrice(article.price);
        setAuthorName(article.author_name || '');
        // We don't pre-fill file input as it's read-only
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setDescription('');
        setPrice('');
        setAuthorName('');
        setFile(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-serif font-bold text-ogene-900 mb-8">Admin Dashboard</h1>

            {/* Live Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Articles', value: stats.totalArticles, icon: FileText },
                    { label: 'Total Sales', value: stats.totalSales, icon: ShoppingCart },
                    { label: 'Total Users', value: stats.totalUsers, icon: Users },
                    { label: 'Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: BarChart },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-ogene-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-ogene-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-ogene-900 mt-1">{stat.value}</p>
                        </div>
                        <div className="p-3 bg-ogene-50 rounded-lg text-ogene-600">
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-ogene-100 sticky top-24">
                        <h2 className="text-xl font-bold text-ogene-900 mb-6 flex items-center gap-2">
                            <Upload size={20} />
                            {editingId ? 'Edit Article' : 'Upload New Article'}
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Article Title" />
                            </div>

                            {/* Author Name Input */}
                            <div>
                                <Label htmlFor="author">Author Name</Label>
                                <Input
                                    id="author"
                                    value={authorName}
                                    onChange={e => setAuthorName(e.target.value)}
                                    required
                                    placeholder="e.g. Chinua Achebe"
                                />
                            </div>

                            <div>
                                <Label htmlFor="desc">Description</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400 min-h-[100px]"
                                    id="desc"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Short summary..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="price">Price (NGN)</Label>
                                <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
                            </div>

                            <div>
                                <Label htmlFor="file">Article File (PDF)</Label>
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={e => setFile(e.target.files[0])}
                                    className="block w-full text-sm text-ogene-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ogene-50 file:text-ogene-700 hover:file:bg-ogene-100 mt-2"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" className="w-full" isLoading={uploading} disabled={(!editingId && !file) || !title}>
                                    {editingId ? 'Update Article' : 'Upload Article'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Article List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden">
                        <div className="p-6 border-b border-ogene-100">
                            <h2 className="text-xl font-bold text-ogene-900">Manage Articles</h2>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-ogene-500">Loading articles...</div>
                        ) : articles.length === 0 ? (
                            <div className="p-8 text-center text-ogene-500">No articles uploaded yet.</div>
                        ) : (
                            <ul className="divide-y divide-ogene-100">
                                {articles.map((article) => (
                                    <li key={article.id} className="p-6 flex items-center justify-between hover:bg-ogene-50 transition-colors">
                                        <div>
                                            <h3 className="text-lg font-medium text-ogene-900">{article.title}</h3>
                                            <p className="text-sm text-ogene-500 mt-1">{article.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-ogene-400">
                                                <span>Price: ₦{article.price}</span>
                                                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(article)}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(article.id)}>Delete</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
