import React, { useState, useRef, useCallback } from 'react';
import { Upload, Calendar, Check, Download, AlertCircle, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { Course, AppState } from './types';
import { parseScheduleImage } from './services/gemini';
import { generateICS } from './utils/ics';
import CourseCard from './components/CourseCard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [courses, setCourses] = useState<Course[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [semesterStart, setSemesterStart] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setCourses([]);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      startAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async (base64Image: string) => {
    setAppState(AppState.ANALYZING);
    try {
      const parsedCourses = await parseScheduleImage(base64Image);
      setCourses(parsedCourses);
      setAppState(AppState.REVIEW);
    } catch (err) {
      setError("无法识别图片内容，请确保图片清晰并包含课程表信息。");
      setAppState(AppState.IDLE);
    }
  };

  const updateCourse = useCallback((updated: Course) => {
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  }, []);

  const addNewCourse = () => {
    const newCourse: Course = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新课程',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:30',
      location: '',
      teacher: '',
      weeks: '1-16'
    };
    setCourses([...courses, newCourse]);
  };

  const handleExport = () => {
    try {
      if (courses.length === 0) {
        setError("课程列表为空");
        return;
      }
      const icsContent = generateICS(courses, new Date(semesterStart));
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', '课程表.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setAppState(AppState.EXPORT_SUCCESS);
    } catch (err) {
      setError("导出失败，请重试");
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setImagePreview(null);
    setCourses([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 md:px-8">
      {/* Header */}
      <header className="mb-10 text-center max-w-lg">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <Calendar className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">课程表导出工具</h1>
        <p className="text-slate-500">
          拍照上传课程表，AI 自动识别并生成日历文件，一键同步到 iPhone/Android。
        </p>
      </header>

      <main className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[400px] flex flex-col relative">
        
        {/* Progress Bar (Simple) */}
        {appState !== AppState.IDLE && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
            <div 
              className={`h-full bg-indigo-500 transition-all duration-500 ease-in-out ${
                appState === AppState.ANALYZING ? 'w-1/2 animate-pulse' : 
                appState === AppState.REVIEW ? 'w-3/4' : 'w-full'
              }`}
            />
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-4 flex items-center gap-3 border-b border-red-100">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-xs hover:underline">关闭</button>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {appState === AppState.IDLE && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">点击上传课程表图片</h3>
              <p className="text-sm text-slate-400">支持 JPG, PNG 格式</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* STEP 2: ANALYZING */}
        {appState === AppState.ANALYZING && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="relative">
               {imagePreview && (
                 <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl opacity-50 blur-sm" />
               )}
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="animate-spin text-indigo-600" size={48} />
               </div>
            </div>
            <h3 className="text-lg font-medium text-slate-700">正在智能分析课程信息...</h3>
            <p className="text-sm text-slate-400">这通常需要几秒钟，请稍候</p>
          </div>
        )}

        {/* STEP 3 & 4: REVIEW & EXPORT */}
        {(appState === AppState.REVIEW || appState === AppState.EXPORT_SUCCESS) && (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <button 
                onClick={reset}
                className="flex items-center text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} className="mr-1" /> 重选图片
              </button>
              
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-500 font-medium">开学日期:</span>
                   <input 
                      type="date" 
                      value={semesterStart}
                      onChange={(e) => setSemesterStart(e.target.value)}
                      className="bg-slate-100 border-none rounded-md px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
                   />
                 </div>
                 <button 
                  onClick={addNewCourse}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="添加课程"
                 >
                   <Plus size={18} />
                 </button>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {courses.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>未找到课程，请尝试手动添加</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <CourseCard 
                      key={course.id} 
                      course={course} 
                      onChange={updateCourse} 
                      onDelete={deleteCourse}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-white border-t border-slate-100">
              {appState === AppState.EXPORT_SUCCESS ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">导出成功！</h3>
                  <p className="text-sm text-slate-500 mb-4">请在下载的文件中打开以导入日历。</p>
                  <button 
                    onClick={() => setAppState(AppState.REVIEW)}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    返回修改
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleExport}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                  <Download size={20} />
                  生成日历文件 (.ics)
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-slate-400 text-sm">
        <p>Powered by Google Gemini 2.0</p>
      </footer>
    </div>
  );
};

export default App;