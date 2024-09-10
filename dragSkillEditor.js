/*
 * Copyright (c) 2024 Veikka Hongisto
 * This code is free to use as long as this copyright notice is kept in the code.
 */
document.addEventListener('DOMContentLoaded', function() {
    const skillEditor = document.getElementById('skill-editor');
    const skillEditorHeader = document.getElementById('skill-editor-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    skillEditorHeader.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = skillEditor.offsetLeft;
        startTop = skillEditor.offsetTop;
        skillEditor.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        skillEditor.style.left = startLeft + deltaX + 'px';
        skillEditor.style.top = startTop + deltaY + 'px';
    }

    function stopDragging() {
        isDragging = false;
        skillEditor.style.cursor = 'grab';
    }

    function resetPosition() {
        skillEditor.style.left = '50%';
        skillEditor.style.top = '50%';
        skillEditor.style.transform = 'translate(-50%, -50%)';
    }

    document.addEventListener('skillEditorOpened', resetPosition);
});