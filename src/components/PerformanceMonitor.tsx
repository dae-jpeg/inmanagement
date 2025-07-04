import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Activity, Cpu, Zap } from 'lucide-react';

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState({
    fps: 0,
    memory: 0,
    cpu: 0,
    errors: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  useEffect(() => {
    if (!isMonitoring) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let errorCount = 0;

    // Monitor FPS
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setPerformanceData(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    // Monitor memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory as { usedJSHeapSize: number };
        setPerformanceData(prev => ({
          ...prev,
          memory: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }
    };

    // Monitor errors
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      errorCount++;
      setPerformanceData(prev => ({ ...prev, errors: errorCount }));
      setErrorLog(prev => [...prev.slice(-10), `Error: ${args.join(' ')}`]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      errorCount++;
      setPerformanceData(prev => ({ ...prev, errors: errorCount }));
      setErrorLog(prev => [...prev.slice(-10), `Warning: ${args.join(' ')}`]);
      originalWarn.apply(console, args);
    };

    // Start monitoring
    measureFPS();
    const memoryInterval = setInterval(measureMemory, 1000);

    return () => {
      clearInterval(memoryInterval);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setErrorLog([]);
    setPerformanceData({ fps: 0, memory: 0, cpu: 0, errors: 0 });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const clearLogs = () => {
    setErrorLog([]);
    setPerformanceData({ fps: 0, memory: 0, cpu: 0, errors: 0 });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Start Monitoring
            </Button>
            <Button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              variant="outline"
            >
              Stop Monitoring
            </Button>
            <Button
              onClick={clearLogs}
              variant="outline"
            >
              Clear Logs
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{performanceData.fps}</div>
              <div className="text-sm text-blue-700">FPS</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{performanceData.memory}MB</div>
              <div className="text-sm text-green-700">Memory</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{performanceData.cpu}%</div>
              <div className="text-sm text-yellow-700">CPU</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{performanceData.errors}</div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
          </div>

          {errorLog.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Recent Errors/Warnings:</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {errorLog.map((log, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-100 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor; 