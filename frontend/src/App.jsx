import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import StudentList from './pages/StudentList';
import TeacherList from './pages/TeacherList';
import AssignmentList from './pages/AssignmentList';
import AssignmentDetail from './pages/AssignmentDetail';
import SilentStudents from './pages/SilentStudents';
import AtRiskStudents from './pages/AtRiskStudents';
import TlcCourseList from './pages/TlcCourseList';
import TlcCourseDetail from './pages/TlcCourseDetail';

const basename = import.meta.env.VITE_BASE_PATH || '/';

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="students" element={<StudentList />} />
          <Route path="teachers" element={<TeacherList />} />
          <Route path="assignments" element={<AssignmentList />} />
          <Route path="assignments/:id" element={<AssignmentDetail />} />
          <Route path="silent-students" element={<SilentStudents />} />
          <Route path="at-risk-students" element={<AtRiskStudents />} />
          <Route path="tlc-courses" element={<TlcCourseList />} />
          <Route path="tlc-courses/:id" element={<TlcCourseDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
