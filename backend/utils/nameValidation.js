export const validateStudyName = (name) => {
    if (!name || typeof name !== 'string') {
        return { isValid: false, formattedName: '', error: 'Name must be a string.' };
    }

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
        return { isValid: false, formattedName: '', error: 'Name must be between 2 and 20 characters.' };
    }

    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return { isValid: false, formattedName: '', error: 'Name can only contain letters and spaces.' };
    }

    const lower = trimmed.toLowerCase();
    
    // Generic rejections
    const genericNames = ['user', 'test', 'admin', 'guest', 'student'];
    for (const generic of genericNames) {
        if (lower.includes(generic)) {
            return { isValid: false, formattedName: '', error: 'Please enter a real name.' };
        }
    }

    // Teacher rejections
    const teacherNames = ['sarah', 'alex', 'mentor', 'coach'];
    if (teacherNames.includes(lower)) {
        return { isValid: false, formattedName: '', error: 'Please choose a different name.' };
    }

    const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    return { isValid: true, formattedName, error: '' };
};

export const isValidDisplayName = (name) => {
    // For checking account display names
    if (!name || typeof name !== 'string') return false;
    
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    
    const lower = trimmed.toLowerCase();
    
    const looksGeneric =
        /^\d+$/.test(lower) ||
        /^user\d*$/i.test(lower) ||
        /^test\d*$/i.test(lower) ||
        /^[a-z]*\d+[a-z\d]*$/i.test(lower);
        
    if (looksGeneric) return false;
    
    const genericNames = ['admin', 'guest', 'student'];
    for (const generic of genericNames) {
        if (lower.includes(generic)) return false;
    }
    
    return true;
};
