import {
  Box, Typography, Radio, RadioGroup, FormControlLabel, Checkbox, CircularProgress,
} from '@mui/material';
import type { PricingQuestion } from '../../../types';
import SectionLabel from './SectionLabel';
import { colors } from '../../../tokens';

interface PricingQuestionsProps {
  questions: PricingQuestion[];
  loading: boolean;
  answers: Record<number, number[]>;
  onChange: (questionId: number, optionId: number, questionType: PricingQuestion['question_type']) => void;
}

export default function PricingQuestions({ questions, loading, answers, onChange }: PricingQuestionsProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
        <CircularProgress size={18} />
        <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>Sorular yukleniyor...</Typography>
      </Box>
    );
  }

  if (questions.length === 0) return null;

  return (
    <>
      <SectionLabel>Ek Bilgiler</SectionLabel>
      {questions.map((q) => (
        <Box key={q.id} sx={{ mb: 2, p: 2, bgcolor: colors.neutral[50], borderRadius: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.neutral[900], mb: 1 }}>
            {q.question_text}
          </Typography>

          {(q.question_type === 'single_choice' || q.question_type === 'boolean') ? (
            <RadioGroup
              value={answers[q.id]?.[0] ?? ''}
              onChange={(_e, val) => onChange(q.id, Number(val), q.question_type)}
            >
              {q.options.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  value={opt.id}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>{opt.option_text}</Typography>
                      {parseFloat(opt.surcharge_amount) > 0 && (
                        <Typography sx={{ fontSize: 11, color: colors.danger[500], fontWeight: 600 }}>
                          +{parseFloat(opt.surcharge_amount).toLocaleString('tr-TR')} TL
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ '& .MuiTypography-root': { fontSize: 13 } }}
                />
              ))}
            </RadioGroup>
          ) : (
            <Box>
              {q.options.map((opt) => {
                const selected = answers[q.id]?.includes(opt.id) ?? false;
                return (
                  <FormControlLabel
                    key={opt.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={selected}
                        onChange={() => onChange(q.id, opt.id, 'multiple_choice')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>{opt.option_text}</Typography>
                        {parseFloat(opt.surcharge_amount) > 0 && (
                          <Typography sx={{ fontSize: 11, color: colors.danger[500], fontWeight: 600 }}>
                            +{parseFloat(opt.surcharge_amount).toLocaleString('tr-TR')} TL
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ display: 'flex', '& .MuiTypography-root': { fontSize: 13 } }}
                  />
                );
              })}
            </Box>
          )}
        </Box>
      ))}
    </>
  );
}
