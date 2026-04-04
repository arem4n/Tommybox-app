/**
 * Re-export from the refactored agenda module.
 * All existing imports of './AgendaSection' continue to work unchanged.
 */
export { default } from './agenda/index';
      {/* ── ¿Cómo te sentiste hoy? ── */}
      {canRegisterFeeling && !user?.isTrainer && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cómo te sentiste hoy?</h2>
          <p className="text-xs text-gray-400 mb-4">+5 XP por registrar</p>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {FEELINGS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedFeeling(opt.value)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    selectedFeeling === opt.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
              placeholder="¿Cómo estuvo el entreno? (opcional)"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 text-sm"
            />
            <textarea
              value={recoveryNotes}
              onChange={(e) => setRecoveryNotes(e.target.value)}
              maxLength={150}
              placeholder="Notas de recuperación: sueño, dolores, energía... (opcional)"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16 text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{comment.length}/200</span>
              <div className="flex items-center gap-4">
                {successMessage && <span className="text-green-600 font-bold animate-pulse">{successMessage}</span>}
                <button
                  onClick={handleRegisterFeeling}
                  disabled={!selectedFeeling}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
