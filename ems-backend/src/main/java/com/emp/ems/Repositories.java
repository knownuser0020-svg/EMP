package com.emp.ems;
import jakarta.persistence.LockModeType;import org.springframework.data.domain.*;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import java.time.*;import java.util.*;
interface EmployeeRepository extends JpaRepository<Employee,UUID>{Optional<Employee> findByEmailIgnoreCase(String email);boolean existsByEmailIgnoreCase(String email);Page<Employee> findByStatus(String status,Pageable page);
 @Query("select e from Employee e where lower(e.name) like lower(concat('%',:search,'%')) or lower(e.email) like lower(concat('%',:search,'%')) or lower(e.title) like lower(concat('%',:search,'%'))")Page<Employee> search(@Param("search")String search,Pageable page);
 @Lock(LockModeType.PESSIMISTIC_WRITE)@Query("select e from Employee e where e.id=:id")Optional<Employee> lockById(@Param("id")UUID id);
 @Modifying @Query("update Employee e set e.authVersion=e.authVersion+1 where e.id=:id")void revokeTokens(@Param("id")UUID id);
}
interface LeaveRepository extends JpaRepository<LeaveRequest,UUID>{Page<LeaveRequest> findByEmployeeId(UUID id,Pageable page);
 @Query("select l from LeaveRequest l where l.startDate<=:until and l.endDate>=:from and l.status<>'Rejected'")Page<LeaveRequest> timeline(@Param("from")LocalDate from,@Param("until")LocalDate until,Pageable page);
 @Query("select count(l)>0 from LeaveRequest l where l.employee.id=:id and l.status<>'Rejected' and l.startDate<=:until and l.endDate>=:from")boolean overlaps(@Param("id")UUID id,@Param("from")LocalDate from,@Param("until")LocalDate until);
}
interface AttendanceRepository extends JpaRepository<Attendance,UUID>{Optional<Attendance> findByEmployeeIdAndClockOutIsNull(UUID id);Page<Attendance> findByEmployeeId(UUID id,Pageable page);
 @Query("select count(a)>0 from Attendance a where a.employee.id=:id and a.clockIn<=:from and (a.clockOut is null or a.clockOut>=:until)")boolean covers(@Param("id")UUID id,@Param("from")Instant from,@Param("until")Instant until);
}
interface ActivityRepository extends JpaRepository<ActivityLog,UUID>{boolean existsByEmployeeIdAndBatchId(UUID id,UUID batchId);Page<ActivityLog> findByEmployeeId(UUID id,Pageable page);@Modifying @Query("delete from ActivityLog a where a.logDate<:before")void deleteOld(@Param("before")LocalDate before);}
interface TaskRepository extends JpaRepository<OnboardingTask,UUID>{List<OnboardingTask> findByEmployeeIdOrderBySortOrder(UUID id);List<OnboardingTask> findByEmployeeIdInOrderBySortOrder(Collection<UUID> ids);}
interface EventRepository extends JpaRepository<WorkspaceEvent,UUID>{}
