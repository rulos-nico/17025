import { useState } from 'react';
import ReactGantt from '@dhtmlx/trial-react-gantt';
import '@dhtmlx/trial-react-gantt/dist/react-gantt.css';
import { demoData } from './DemoData'

export default function BasicGantt() {
  const [theme, setTheme] = useState("terrace");
  const [tasks, setTasks] = useState(demoData.tasks);
  const [links, setLinks] = useState(demoData.links);

  return (
    <div style={{ height: '500px' }}>
      <ReactGantt
        tasks={tasks}
        links={links}
        theme={theme}
      />
    </div>
  );
}
