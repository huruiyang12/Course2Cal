import React from 'react';
import { Course, WEEK_DAYS } from '../types';
import { Trash2, MapPin, User, Clock, CalendarRange } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onChange: (updated: Course) => void;
  onDelete: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onChange, onDelete }) => {
  const handleChange = (field: keyof Course, value: any) => {
    onChange({ ...course, [field]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 group relative">
      <button 
        onClick={() => onDelete(course.id)}
        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="删除课程"
      >
        <Trash2 size={16} />
      </button>

      <div className="space-y-3">
        {/* Course Name */}
        <div>
          <input
            type="text"
            value={course.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="课程名称"
            className="w-full font-semibold text-slate-800 placeholder-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5"
          />
        </div>

        {/* Time & Day */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-1 bg-indigo-50 px-2 py-1 rounded text-xs text-indigo-700">
            <Clock size={12} />
            <select
              value={course.dayOfWeek}
              onChange={(e) => handleChange('dayOfWeek', parseInt(e.target.value))}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              {WEEK_DAYS.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-1 text-sm text-slate-600">
            <input
              type="time"
              value={course.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <span>-</span>
            <input
              type="time"
              value={course.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Location & Teacher & Weeks */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-slate-500">
            <MapPin size={14} className="shrink-0" />
            <input
              type="text"
              value={course.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="地点"
              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 placeholder-slate-300"
            />
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <User size={14} className="shrink-0" />
            <input
              type="text"
              value={course.teacher}
              onChange={(e) => handleChange('teacher', e.target.value)}
              placeholder="教师"
              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 placeholder-slate-300"
            />
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <CalendarRange size={14} className="shrink-0" />
             <input
              type="text"
              value={course.weeks}
              onChange={(e) => handleChange('weeks', e.target.value)}
              placeholder="周次 (如: 1-16, 1-17单)"
              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 placeholder-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;