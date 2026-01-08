import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    Target,
    Upload,
    CheckCircle,
    Circle,
    Trash2,
    Edit2,
    Plus,
    PlusCircle,
    Search,
    ChevronDown,
    ChevronUp,
    Layers,
    BarChart3,
    ArrowRight,
    Rocket,
    Activity,
    PieChart
} from 'lucide-react';

export default function Roadmap() {
    const [todos, setTodos] = useState([]);

    // Initialize from localStorage if available (Lazy Initialization with migration check)
    const [previewTasks, setPreviewTasks] = useState(() => {
        const saved = localStorage.getItem('roadmap_preview');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validate structure: must be an array where EVERY item has a 'sections' array
                // If it's the old flat format, it will be an array of {section, tasks}
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const isNewFormat = parsed.every(item => Array.isArray(item.sections));
                    if (isNewFormat) return parsed;

                    // Simple migration: If it's the old format, wrap it in a "Legacy" PDF group
                    console.warn('Old roadmap format detected in localStorage. Migrating...');
                    return [{
                        filename: 'Legacy Upload',
                        timestamp: 'Existing Data',
                        sections: parsed
                    }];
                }
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Failed to parse stored preview', e);
                return [];
            }
        }
        return [];
    });

    const [editingTask, setEditingTask] = useState(null); // { pdfIdx, sectionIdx, taskIdx }
    const [editValue, setEditValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedSections, setCollapsedSections] = useState({});

    // Toggle section collapse
    const toggleSection = (name) => {
        setCollapsedSections(prev => ({ ...prev, [name]: !prev[name] }));
    };

    // Persist to localStorage whenever previewTasks changes
    useEffect(() => {
        localStorage.setItem('roadmap_preview', JSON.stringify(previewTasks));
    }, [previewTasks]);

    const startEditing = (e, pdfIdx, sectionIndex, taskIndex, currentTaskName) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingTask({ pdfIdx, sectionIndex, taskIndex });
        setEditValue(currentTaskName);
    };

    const cancelEditing = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setEditingTask(null);
        setEditValue('');
    };

    const saveEditing = (e, pdfIdx, sectionIndex, taskIndex) => {
        e.preventDefault();
        e.stopPropagation();

        if (!editValue.trim()) return; // Don't save empty tasks

        const newPreviewTasks = [...previewTasks];
        const newPdfGroup = { ...newPreviewTasks[pdfIdx] };
        newPdfGroup.sections = [...newPdfGroup.sections];

        const newSection = { ...newPdfGroup.sections[sectionIndex] };
        newSection.tasks = [...newSection.tasks];

        const currentTaskObj = newSection.tasks[taskIndex];
        if (typeof currentTaskObj === 'string') {
            newSection.tasks[taskIndex] = editValue;
        } else {
            newSection.tasks[taskIndex] = { ...currentTaskObj, task: editValue };
        }

        newPdfGroup.sections[sectionIndex] = newSection;
        newPreviewTasks[pdfIdx] = newPdfGroup;

        setPreviewTasks(newPreviewTasks);
        setEditingTask(null);
        setEditValue('');
    };

    // ... handleAddPreviewTask ...

    // Replace handleEditPreviewTask (removed)

    // ... handleDeletePreviewTask ...






    const fetchTodos = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/todos');
            setTodos(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    /// eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const res = await axios.post('http://localhost:3000/api/upload-roadmap', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Backend returns structured sections in res.data.tasks
            const newPdfGroup = {
                filename: file.name,
                timestamp: new Date().toLocaleString(),
                sections: res.data.tasks
            };

            setPreviewTasks(prev => [...prev, newPdfGroup]);
            alert(`Roadmap parsed! "${file.name}" has been added to your preview.`);
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
            alert('Upload failed: ' + errorMessage);
        }
    };

    const saveFromPreview = async () => {
        try {
            // Flatten the nested structure: Combine all sections from all PDFs
            const allSections = previewTasks.flatMap(pdf => pdf.sections);

            await axios.post('http://localhost:3000/api/todos/batch', { tasks: allSections });
            setPreviewTasks([]); // Clear preview
            fetchTodos(); // Refresh main list
            alert('All tasks from all PDFs added to your Todo list!');
        } catch (err) {
            console.error(err);
            alert('Failed to save tasks.');
        }
    };

    const toggleTodo = async (id, currentStatus) => {
        try {
            await axios.patch(`http://localhost:3000/api/todos/${id}`, { is_completed: !currentStatus });
            fetchTodos();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTodo = async (e, id) => {
        e.stopPropagation();
        try {
            await axios.delete(`http://localhost:3000/api/todos/${id}`);
            fetchTodos();
        } catch (err) {
            console.error(err);
        }
    };

    const editTodo = async (e, todo) => {
        e.stopPropagation();
        const newTask = prompt('Edit task:', todo.task);
        if (newTask === null || newTask === todo.task) return;

        try {
            await axios.patch(`http://localhost:3000/api/todos/${todo.id}`, { task: newTask });
            fetchTodos();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTodoToSection = async (sectionName) => {
        const taskName = prompt(`Add task to ${sectionName}:`);
        if (!taskName) return;

        try {
            await axios.post('http://localhost:3000/api/todos', {
                task: taskName,
                section: sectionName,
                is_completed: false,
                source: 'manual'
            });
            fetchTodos();
        } catch (err) {
            console.error(err);
            alert('Failed to add task');
        }
    };

    const handleRenameSection = async (oldName) => {
        const newName = prompt('Rename section:', oldName);
        if (!newName || newName === oldName) return;

        try {
            // encoding the section name is important if it has special chars
            await axios.put(`http://localhost:3000/api/sections/${encodeURIComponent(oldName)}`, { newName });
            fetchTodos();
        } catch (err) {
            console.error(err);
            alert('Failed to rename section');
        }
    };

    const handleDeleteSection = async (sectionName) => {
        if (!confirm(`Delete section "${sectionName}" and ALL its tasks?`)) return;

        try {
            await axios.delete(`http://localhost:3000/api/sections/${encodeURIComponent(sectionName)}`);
            fetchTodos();
        } catch (err) {
            console.error(err);
            alert('Failed to delete section');
        }
    };

    const handleAddPreviewTask = (e, pdfIdx, sectionIndex) => {
        e.preventDefault();
        e.stopPropagation();
        const pdfGroup = previewTasks[pdfIdx];
        const section = pdfGroup.sections[sectionIndex];
        const taskName = prompt(`Add task to ${section.section || "General"}:`);
        if (!taskName) return;

        const newPreviewTasks = [...previewTasks];
        const newPdfGroup = { ...newPreviewTasks[pdfIdx] };
        newPdfGroup.sections = [...newPdfGroup.sections];

        const newSection = { ...newPdfGroup.sections[sectionIndex] };
        newSection.tasks = [...(newSection.tasks || [])];

        newSection.tasks.push({ task: taskName, details: '' });
        newPdfGroup.sections[sectionIndex] = newSection;
        newPreviewTasks[pdfIdx] = newPdfGroup;

        console.log('Adding preview task:', taskName, 'to section:', sectionIndex);
        setPreviewTasks(newPreviewTasks);
    };

    const handleAddSinglePreviewTask = async (e, pdfIdx, sectionIndex, taskIndex) => {
        e.preventDefault();
        e.stopPropagation();

        const pdfGroup = previewTasks[pdfIdx];
        const section = pdfGroup.sections[sectionIndex];
        const taskObj = section.tasks[taskIndex];

        const taskName = typeof taskObj === 'string' ? taskObj : taskObj.task;
        const taskDetails = typeof taskObj === 'object' ? taskObj.details : '';
        const sectionName = section.section || 'General';

        try {
            await axios.post('http://localhost:3000/api/todos', {
                task: taskName,
                details: taskDetails,
                section: sectionName,
                is_completed: false,
                source: 'pdf'
            });

            // Remove from preview UI (locally)
            const newPreviewTasks = [...previewTasks];
            const newPdfGroup = { ...newPreviewTasks[pdfIdx] };
            newPdfGroup.sections = [...newPdfGroup.sections];

            const newSection = { ...newPdfGroup.sections[sectionIndex] };
            newSection.tasks = [...newSection.tasks];

            newSection.tasks.splice(taskIndex, 1);

            // Handle empty section or PDF cleanup?
            newPdfGroup.sections[sectionIndex] = newSection;
            newPreviewTasks[pdfIdx] = newPdfGroup;

            setPreviewTasks(newPreviewTasks);
            fetchTodos();

        } catch (err) {
            console.error(err);
            alert('Failed to add task to list');
        }
    };

    const handleDeletePreviewTask = (e, pdfIdx, sectionIndex, taskIndex) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this task from preview?')) return;

        const newPreviewTasks = [...previewTasks];
        const newPdfGroup = { ...newPreviewTasks[pdfIdx] };
        newPdfGroup.sections = [...newPdfGroup.sections];

        const newSection = { ...newPdfGroup.sections[sectionIndex] };
        newSection.tasks = [...newSection.tasks];

        newSection.tasks.splice(taskIndex, 1);

        newPdfGroup.sections[sectionIndex] = newSection;
        newPreviewTasks[pdfIdx] = newPdfGroup;

        setPreviewTasks(newPreviewTasks);
    };

    const handleCreateManualRoadmap = () => {
        const title = prompt('Enter a title for your manual roadmap:', 'My Manual Roadmap');
        if (!title) return;

        const newPdfGroup = {
            filename: title,
            timestamp: new Date().toLocaleString(),
            sections: [{ section: 'New Section', tasks: [] }]
        };

        setPreviewTasks(prev => [...prev, newPdfGroup]);
    };

    const handleRenamePreviewPdf = (e, pdfIdx) => {
        e.preventDefault();
        e.stopPropagation();
        const oldName = previewTasks[pdfIdx].filename;
        const newName = prompt('Rename this roadmap:', oldName);
        if (!newName || newName === oldName) return;

        const newPreviewTasks = [...previewTasks];
        newPreviewTasks[pdfIdx] = { ...newPreviewTasks[pdfIdx], filename: newName };
        setPreviewTasks(newPreviewTasks);
    };

    const handleAddNewSectionToPreview = (e, pdfIdx) => {
        e.preventDefault();
        e.stopPropagation();
        const sectionName = prompt('Enter name for the new section:');
        if (!sectionName) return;

        const newPreviewTasks = [...previewTasks];
        const newPdfGroup = { ...newPreviewTasks[pdfIdx] };
        newPdfGroup.sections = [...(newPdfGroup.sections || []), { section: sectionName, tasks: [] }];
        newPreviewTasks[pdfIdx] = newPdfGroup;
        setPreviewTasks(newPreviewTasks);
    };

    const handleDeletePdfFromPreview = (e, pdfIdx) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Remove this entire PDF and its tasks from preview?')) return;

        const newPreviewTasks = [...previewTasks];
        newPreviewTasks.splice(pdfIdx, 1);
        setPreviewTasks(newPreviewTasks);
    };

    const groupedTodos = todos.reduce((groups, todo) => {
        const section = todo.section || 'Uncategorized';
        if (!groups[section]) groups[section] = [];
        groups[section].push(todo);
        return groups;
    }, {});

    const sectionProgress = Object.entries(groupedTodos).reduce((acc, [name, items]) => {
        const completed = items.filter(i => i.is_completed === 1).length;
        acc[name] = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
        return acc;
    }, {});

    const filteredSections = Object.entries(groupedTodos).filter(([name, tasks]) => {
        if (!searchQuery) return true;
        const matchesName = name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTasks = tasks.some(t => t.task.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesName || matchesTasks;
    });

    const totalProgress = todos.length > 0 ? Math.round((todos.filter(t => t.is_completed === 1).length / todos.length) * 100) : 0;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
            <header className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 -mx-6 -mt-6 p-12 rounded-b-[4rem] text-white shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Layers size={240} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500/30 rounded-xl backdrop-blur-md">
                                <Target className="text-indigo-300" size={24} />
                            </div>
                            <span className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-xs">Learning Management</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tight leading-tight">Interactive Roadmap</h1>
                        <p className="text-indigo-100/70 mt-3 text-lg font-medium max-w-xl">Visualize your curriculum, track section-level progress, and conquer your goals with precision.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 text-center">
                            <div className="text-3xl font-black">{todos.length}</div>
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Total Goals</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 text-center min-w-[120px]">
                            <div className="text-3xl font-black text-emerald-400">{totalProgress}%</div>
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Mastery</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Quick Actions Card */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Upload size={20} /></div>
                        <h3 className="font-black text-slate-800 tracking-tight">Expand Curriculum</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Add new sections to your roadmap by uploading a PDF curriculum or starting a manual module.</p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                            <Upload size={16} /> Import PDF
                            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                        </label>
                        <button
                            onClick={handleCreateManualRoadmap}
                            className="bg-white border-2 border-slate-100 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Create Manual
                        </button>
                    </div>
                </div>
                <div className="w-px bg-slate-100 hidden md:block"></div>
                <div className="w-full md:w-1/3 flex flex-col justify-center items-center text-center p-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <BarChart3 className="text-slate-300 mb-3" size={32} />
                    <span className="text-xs font-bold text-slate-400">Section Analysis Active</span>
                    <div className="mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">Tracking accuracy: 100%</div>
                </div>
            </div>

            {/* Preview Section */}
            {previewTasks.length > 0 && (
                <div className="bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 rounded-[3rem] p-10 mt-6 shadow-xl shadow-indigo-100/50">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                        <div>
                            <div className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Staging Area</div>
                            <h3 className="text-3xl font-black text-indigo-900 tracking-tight">Confirm Roadmap Modules</h3>
                            <p className="text-indigo-700/60 font-medium mt-1">Review {previewTasks.length} pending roadmap source(s) before syncing.</p>
                        </div>
                        <button
                            onClick={saveFromPreview}
                            className="w-full md:w-auto bg-indigo-600 hover:bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-200"
                        >
                            Sync All to List
                        </button>
                    </div>

                    <div className="space-y-6">
                        {previewTasks.map((pdfGroup, pIdx) => (
                            <div key={pIdx} className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
                                {/* PDF Source Header */}
                                <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-500 rounded-lg">
                                            <Target size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm leading-tight">{pdfGroup.filename}</h4>
                                            <p className="text-[10px] text-indigo-100 uppercase tracking-wider">{pdfGroup.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleRenamePreviewPdf(e, pIdx)}
                                            className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors"
                                            title="Rename Roadmap"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleAddNewSectionToPreview(e, pIdx)}
                                            className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors"
                                            title="Add New Section"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-indigo-400 mx-1"></div>
                                        <button
                                            onClick={(e) => handleDeletePdfFromPreview(e, pIdx)}
                                            className="p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                            title="Remove from Preview"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto p-2 space-y-4">
                                    {pdfGroup.sections?.map((section, sIdx) => (
                                        <div key={sIdx} className="border border-gray-100 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border-b border-gray-100 flex justify-between items-center group/psection">
                                                <span>{section.section || "General"}</span>
                                                <button
                                                    onClick={(e) => handleAddPreviewTask(e, pIdx, sIdx)}
                                                    className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Add Task to Preview"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <ul className="divide-y divide-gray-50">
                                                {section.tasks?.map((task, tIdx) => {
                                                    const isEditing = editingTask?.pdfIdx === pIdx && editingTask?.sectionIndex === sIdx && editingTask?.taskIndex === tIdx;
                                                    const taskText = typeof task === 'string' ? task : task.task;

                                                    return (
                                                        <li key={tIdx} className="p-3 text-sm text-gray-700 group flex justify-between items-start hover:bg-gray-50">
                                                            <div className="flex-1 mr-2">
                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editValue}
                                                                            onChange={(e) => setEditValue(e.target.value)}
                                                                            className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                                                                            autoFocus
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') saveEditing(e, pIdx, sIdx, tIdx);
                                                                                if (e.key === 'Escape') cancelEditing(e);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="font-medium">{taskText}</span>
                                                                        {typeof task === 'object' && task.details && (
                                                                            <p className="text-xs text-gray-500 mt-0.5">{task.details}</p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => saveEditing(e, pIdx, sIdx, tIdx)}
                                                                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                            title="Save"
                                                                        >
                                                                            <CheckCircle size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={cancelEditing}
                                                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                                            title="Cancel"
                                                                        >
                                                                            <Circle size={14} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => handleAddSinglePreviewTask(e, pIdx, sIdx, tIdx)}
                                                                            className="p-1 text-green-600 hover:text-green-700 rounded transition-colors"
                                                                            title="Add to My List"
                                                                        >
                                                                            <PlusCircle size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => startEditing(e, pIdx, sIdx, tIdx, taskText)}
                                                                            className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                                                            title="Edit Preview Task"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => handleDeletePreviewTask(e, pIdx, sIdx, tIdx)}
                                                                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                                                            title="Remove from Preview"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Curriculum Hub */}
            <div className="space-y-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Saved Curriculum</h2>
                            <p className="text-slate-400 font-bold text-sm">Managed Roadmap Modules & Sections</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search curriculum..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-50 shadow-sm font-bold text-slate-600 placeholder:text-slate-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {todos.length === 0 ? (
                        <div className="p-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                            <PieChart className="mx-auto text-slate-300 mb-6" size={64} />
                            <h3 className="text-2xl font-black text-slate-700">No curriculum found</h3>
                            <p className="text-slate-400 font-bold mt-2 max-w-sm mx-auto">Upload a PDF roadmap to generate your modules and start tracking your success!</p>
                        </div>
                    ) : (
                        filteredSections.map(([sectionName, sectionTodos]) => {
                            const isCollapsed = collapsedSections[sectionName];
                            const progress = sectionProgress[sectionName];

                            return (
                                <div key={sectionName} className={`bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-500 ${isCollapsed ? 'mb-4' : 'mb-8'}`}>
                                    {/* Section Header */}
                                    <div
                                        className="p-8 cursor-pointer group"
                                        onClick={() => toggleSection(sectionName)}
                                    >
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{sectionName}</h3>
                                                    <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
                                                        {progress === 100 ? 'MASTERED' : 'IN PROGRESS'}
                                                    </span>
                                                </div>

                                                {/* Section Progress Bar */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 min-w-[40px]">{progress}%</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAddTodoToSection(sectionName); }}
                                                        className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                                                        title="Add Task"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRenameSection(sectionName); }}
                                                        className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all"
                                                        title="Rename Section"
                                                    >
                                                        <Edit2 size={20} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(sectionName); }}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                                <div className={`p-4 rounded-3xl bg-slate-50 text-slate-400 transition-all ${isCollapsed ? '' : 'rotate-180 bg-indigo-50 text-indigo-600'}`}>
                                                    <ChevronDown size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task List (Conditional) */}
                                    {!isCollapsed && (
                                        <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                                            <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden">
                                                <ul className="divide-y divide-slate-100/50">
                                                    {sectionTodos.map(todo => (
                                                        <li
                                                            key={todo.id}
                                                            className={`p-6 flex items-center hover:bg-white transition-all group/item ${todo.is_completed ? 'opacity-60 bg-slate-50/20' : ''}`}
                                                            onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id, todo.is_completed); }}
                                                        >
                                                            <div className={`mr-6 p-2 rounded-xl transition-all shadow-sm ${todo.is_completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200 group-hover/item:border-indigo-400'}`}>
                                                                {todo.is_completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                                            </div>

                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-lg font-bold leading-snug ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                                        {todo.task}
                                                                    </span>
                                                                    {todo.source === 'pdf' && (
                                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                                            <Rocket size={12} /> Curriculum
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {todo.details && (
                                                                    <p className={`text-sm mt-1 font-medium ${todo.is_completed ? 'text-slate-300' : 'text-slate-500'}`}>
                                                                        {todo.details}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-4 group-hover/item:translate-x-0 ml-4">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); editTodo(e, todo); }}
                                                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteTodo(e, todo.id); }}
                                                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                                <ArrowRight size={20} className="text-indigo-200 ml-2" />
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
