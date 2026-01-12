import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useModel } from '../../hooks/useModels';
import { AVAILABLE_MODELS, MODEL_NAMES } from '../../config/api.config.js';

function ModelPredictor({ modelName, inputFields, onSubmit }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { predict, loading, error } = useModel(modelName);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const prediction = await predict(formData);
      setResult(prediction);
      if (onSubmit) {
        onSubmit(prediction);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const borderClass = theme === 'dark' ? 'border-white/10' : 'border-[#9FE7F5]/40';
  const bgClass = theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/50';
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#053F5C]';
  const inputClass = theme === 'dark' 
    ? 'bg-slate-800 border-white/10 text-white' 
    : 'bg-white border-[#9FE7F5]/40 text-[#053F5C]';

  return (
    <div className={`rounded-xl border ${borderClass} p-6 ${bgClass} backdrop-blur-xl`}>
      <h3 className={`text-xl font-bold ${textColor} mb-4`}>
        {MODEL_NAMES[modelName] || modelName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputFields.map((field) => (
          <div key={field.name}>
            <label className={`block text-sm font-medium mb-2 ${textColor}`}>
              {field.label}
            </label>
            {field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={formData[field.name] || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#429EBD] focus:ring-[#429EBD]"
              />
            ) : (
              <input
                type={field.type || 'number'}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                required={field.required !== false}
                step={field.step}
                min={field.min}
                max={field.max}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#429EBD] to-[#053F5C] hover:from-[#053F5C] hover:to-[#429EBD]'
          } text-white shadow-lg`}
        >
          {loading ? (language === 'ar' ? 'جاري التنبؤ...' : 'Predicting...') : (language === 'ar' ? 'تنبؤ' : 'Predict')}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-[#9FE7F5]/20'}`}>
          <h4 className={`font-bold mb-2 ${textColor}`}>
            {language === 'ar' ? 'النتيجة:' : 'Result:'}
          </h4>
          <div className="space-y-2 text-sm">
            {result.qualityScore !== undefined && (
              <p className={textColor}>
                <span className="font-semibold">{language === 'ar' ? 'نقاط الجودة:' : 'Quality Score:'}</span> {result.qualityScore.toFixed(2)}
              </p>
            )}
            {result.action && (
              <p className={textColor}>
                <span className="font-semibold">{language === 'ar' ? 'الإجراء:' : 'Action:'}</span> {result.action}
              </p>
            )}
            {result.safetyStatus && (
              <p className={textColor}>
                <span className="font-semibold">{language === 'ar' ? 'حالة السلامة:' : 'Safety Status:'}</span> {result.safetyStatus}
              </p>
            )}
            {result.inferenceTime && (
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-[#429EBD]'}`}>
                {language === 'ar' ? 'وقت الاستدعاء:' : 'Inference Time:'} {result.inferenceTime.toFixed(0)}ms
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelPredictor;

