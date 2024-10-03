import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const addTask = () => {
    if (newTitle.trim() === "") return;

    const newTask: Task = {
      id: Math.random().toString(),
      title: newTitle,
      description: newDescription || "",
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTitle("");
    setNewDescription("");
  };

  const editExistingTask = (task: Task) => {
    setTasks(
      tasks.map((t) =>
        t.id === task.id
          ? { ...task, title: newTitle, description: newDescription }
          : t
      )
    );
    setEditTask(null);
    setNewTitle("");
    setNewDescription("");
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const toggleCompleteTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "complete") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  const openOptions = (task: Task) => {
    setSelectedTask(task);
  };

  const handleOptionsAction = (action: string) => {
    if (selectedTask) {
      if (action === "complete") {
        toggleCompleteTask(selectedTask.id);
      } else if (action === "incomplete") {
        toggleCompleteTask(selectedTask.id);
      } else if (action === "edit") {
        setEditTask(selectedTask);
        setNewTitle(selectedTask.title);
        setNewDescription(selectedTask.description || "");
      } else if (action === "delete") {
        deleteTask(selectedTask.id);
      }
    }
    setSelectedTask(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gerenciador de Tarefas</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Título"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Descrição (Opcional)"
          value={newDescription}
          onChangeText={setNewDescription}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={editTask ? () => editExistingTask(editTask) : addTask}
          >
            <Text style={styles.addButtonText}>
              {editTask ? "Salvar Edição" : "Adicionar Tarefa"}
            </Text>
          </TouchableOpacity>
          {editTask && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditTask(null)}>
              <Text style={styles.cancelButtonText}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {["Todas", "Completas", "Incompletas"].map((type) => (
          <TouchableOpacity
            key={type}
            style={filter === type ? styles.filterButtonActive : styles.filterButton}
            onPress={() => setFilter(type as "all" | "complete" | "incomplete")}
          >
            <Text style={styles.filterButtonText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.taskCard, item.completed ? styles.taskCardComplete : styles.taskCardIncomplete]}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            {item.description ? <Text>{item.description}</Text> : null}
            <Text style={styles.taskStatus}>
              {item.completed ? "Status: Completa" : "Status: Incompleta"}
            </Text>
            <View style={styles.taskActions}>
              <View style={{ flex: 1 }} /> {/* Para empurrar o botão de opções para a direita */}
              <TouchableOpacity style={styles.taskButton} onPress={() => openOptions(item)}>
                <Text style={styles.taskButtonText}>Opções</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {selectedTask && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              handleOptionsAction(selectedTask.completed ? "incomplete" : "complete")
            }
          >
            <Text style={styles.optionButtonText}>
              {selectedTask.completed ? "Marcar como Incompleta" : "Marcar como Completa"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleOptionsAction("edit")}
          >
            <Text style={styles.optionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleOptionsAction("delete")}
          >
            <Text style={styles.optionButtonText}>Excluir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setSelectedTask(null)}
          >
            <Text style={styles.optionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addButton: {
    backgroundColor: "#5AAC44",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  filterButton: {
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
  },
  filterButtonActive: {
    padding: 10,
    backgroundColor: "#5AAC44",
    borderRadius: 5,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  taskCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  taskCardComplete: {
    backgroundColor: "#d4edda",
  },
  taskCardIncomplete: {
    backgroundColor: "#ffeeba",
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  taskStatus: {
    marginTop: 5,
    fontWeight: "bold",
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  taskButton: {
    padding: 5,
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginLeft: 10,
  },
  taskButtonText: {
    color: "#fff",
  },
  optionsContainer: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  optionButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginBottom: 10,
  },
  optionButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});