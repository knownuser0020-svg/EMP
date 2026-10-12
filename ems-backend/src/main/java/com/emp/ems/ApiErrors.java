package com.emp.ems;
import org.springframework.dao.DataIntegrityViolationException;import org.springframework.http.*;import org.springframework.web.bind.MethodArgumentNotValidException;import org.springframework.web.bind.annotation.*;import org.springframework.web.server.ResponseStatusException;import java.util.Map;
@RestControllerAdvice public class ApiErrors{
 @ExceptionHandler(ResponseStatusException.class)ResponseEntity<Map<String,String>> status(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("message",e.getReason()==null?"Request could not be completed.":e.getReason()));}
 @ExceptionHandler(MethodArgumentNotValidException.class)ResponseEntity<Map<String,String>> invalid(MethodArgumentNotValidException e){String message=e.getBindingResult().getFieldErrors().stream().findFirst().map(f->f.getField()+": "+f.getDefaultMessage()).orElse("Check the supplied fields.");return ResponseEntity.badRequest().body(Map.of("message",message));}
 @ExceptionHandler(DataIntegrityViolationException.class)ResponseEntity<Map<String,String>> duplicate(){return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","This record conflicts with an existing record. Refresh and try again."));}
 @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)ResponseEntity<Map<String,String>> concurrent(){return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","This record was updated by someone else. Refresh and try again."));}
}
