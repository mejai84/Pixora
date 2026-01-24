---
description: Realiza un git add, commit y push al repositorio actual con un mensaje personalizado.
---

1. **Obtener mensaje de commit**:
   - Si el usuario YA proporcionó un mensaje en su solicitud (ej: "/commit arreglar login"), úsalo.
   - Si NO proporcionó mensaje, **DETENTE y pregúntale** qué mensaje desea usar para el commit. No inventes uno genérico a menos que te den permiso explícito.

2. **Verificar estado**:
   - Ejecuta `git status` para mostrar al usuario qué archivos serán incluidos.

3. **Ejecutar comandos Git** (en este orden):
   - `git add .`
   - `git commit -m "MENSAJE_DEL_USUARIO"`
   - `git push`

4. **Confirmación**:
   - Valida la salida del `git push` y confirma al usuario que todo está actualizado en el repositorio remoto.
